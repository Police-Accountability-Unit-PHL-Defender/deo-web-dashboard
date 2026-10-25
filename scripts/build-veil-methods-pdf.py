"""Build the methods report from the fitted website cubes (Codex PDF runtime)."""
import json
from html import escape
from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, Circle, String, Rect
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/veil-of-darkness-methods.pdf'
C = json.loads((ROOT / 'public/cubes/veil-comparison.json').read_text())
B = json.loads((ROOT / 'public/cubes/veil.json').read_text())['intraracial']['by_year']
PURPLE, VIOLET, INK, MUTED = '#603285', '#AD5BB4', '#24202E', '#655E70'
W = 504
styles = {
    'title': ParagraphStyle('title', fontName='Times-Bold', fontSize=32, leading=35, textColor=colors.HexColor(INK), spaceAfter=18),
    'h1': ParagraphStyle('h1', fontName='Times-Bold', fontSize=25, leading=29, textColor=colors.HexColor(INK), spaceAfter=16),
    'h2': ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor(PURPLE), spaceBefore=13, spaceAfter=7, keepWithNext=True),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10.2, leading=15, textColor=colors.HexColor(INK), spaceAfter=10),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.7, leading=12.5, textColor=colors.HexColor(MUTED), spaceAfter=8),
    'kicker': ParagraphStyle('kicker', fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=colors.HexColor(PURPLE), spaceAfter=12),
    'cell': ParagraphStyle('cell', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor(INK)),
}
story = []

def clean(s):
    return str(s).replace('\u2013', '-').replace('\u2014', ' - ').replace('\u2212', '-').replace('\u2011', '-')

def p(text, style='body'):
    story.append(Paragraph(clean(text), styles[style]))

def section(number, title):
    if story:
        story.append(PageBreak())
    p(f'DRIVING EQUALITY  /  METHODS &amp; SUPPORTING ANALYSES  /  {number:02}', 'kicker')
    p(title, 'h1')

def table(headers, rows, widths):
    data = [[Paragraph(escape(clean(x)), styles['cell']) for x in row] for row in [headers] + rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEE7F4')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F6FA')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, 0), .6, colors.HexColor('#CFC0DC')),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

def chart(series, ymin, ymax, ticks, xlabel, ylabel, height=245, intervals=False, connect=True):
    d = Drawing(W, height)
    left, right, bottom, top = 44, W-12, 60, height-30
    xs = sorted(set(pt[0] for _, _, pts in series for pt in pts))
    def x(v): return left + (v-xs[0]) / (xs[-1]-xs[0] or 1) * (right-left)
    def y(v): return bottom + (v-ymin)/(ymax-ymin)*(top-bottom)
    for tick in ticks:
        d.add(Line(left, y(tick), right, y(tick), strokeColor=colors.HexColor('#E3DEE8'), strokeWidth=.5))
        d.add(String(left-8, y(tick)-3, str(tick), textAnchor='end', fontName='Helvetica', fontSize=8, fillColor=colors.HexColor(MUTED)))
    if ymin <= 0 <= ymax:
        d.add(Line(left, y(0), right, y(0), strokeColor=colors.HexColor(MUTED), strokeDashArray=[3, 3], strokeWidth=.7))
    for v in xs:
        d.add(String(x(v), bottom-15, str(v), textAnchor='middle', fontName='Helvetica', fontSize=8, fillColor=colors.HexColor(MUTED)))
    d.add(String(left, height-11, ylabel, fontName='Helvetica', fontSize=9, fillColor=colors.HexColor(INK)))
    d.add(String((left+right)/2, 9, xlabel, textAnchor='middle', fontName='Helvetica', fontSize=9, fillColor=colors.HexColor(MUTED)))
    for si, (name, col, pts) in enumerate(series):
        color = colors.HexColor(col)
        if connect:
            for a, b in zip(pts, pts[1:]):
                d.add(Line(x(a[0]), y(a[1]), x(b[0]), y(b[1]), strokeColor=color, strokeWidth=1.3))
        for pt in pts:
            px, py = x(pt[0]), y(pt[1])
            c = colors.HexColor('#AAA4AF') if pt[0] == 2020 else color
            if intervals:
                d.add(Line(px, y(pt[2]), px, y(pt[3]), strokeColor=c, strokeWidth=.8))
                for limit in pt[2:4]:
                    d.add(Line(px-2.5, y(limit), px+2.5, y(limit), strokeColor=c, strokeWidth=.8))
            d.add(Circle(px, py, 2.5, fillColor=c, strokeColor=c))
        lx = left + si*170
        d.add(Line(lx, 27, lx+12, 27, strokeColor=color, strokeWidth=2))
        d.add(String(lx+18, 24, name, fontName='Helvetica', fontSize=8, fillColor=colors.HexColor(INK)))
    return d

def signed(v): return f'{v:+.2f}'
def ci(r): return f"{signed(r['difference_ci_lo_pp'])} to {signed(r['difference_ci_hi_pp'])}"
def label(f): return 'Sole occupant' if f['occupancy'] == 'sole' else {'any_black':'Anyone Black','majority_black':'Majority Black','all_black':'Everyone Black'}[f['rule']]

section(1, 'The veil of darkness')
p('Methods, sensitivity results &amp; a working handoff', 'h2')
p('Philadelphia traffic stops | Analysis years 2014-2019 and 2021-2025<br/>Prepared October 18, 2026', 'small')
p('At the same evening hour, daylight changes with the season. This analysis compares the racial makeup of recorded traffic stops in daylight and darkness, while adjusting for time and place.')
p('What changed after Driving Equality?', 'h2')
r = C['main']
p(f"The fitted Black share was <b>{abs(r['effects']['reference']['effect_pp']):.2f} percentage points lower</b> after dark before the law and <b>{abs(r['effects']['group']['effect_pp']):.2f} points lower</b> afterward. The direct change was <b>{signed(r['difference_pp'])} points</b> (95% interval {ci(r)}). The data do not establish a pre/post change.")
table(['Period', 'Daylight', 'After dark', 'Dark minus daylight'], [[name, f"{e['daylight_pct']:.2f}%", f"{e['dark_pct']:.2f}%", f"{e['effect_pp']:.2f} pp"] for name,e in [('Before the law',r['effects']['reference']),('After the law',r['effects']['group'])]], [125,95,95,189])
p(f"Main sample: <b>{r['n']:,} stops</b> with one adult non-Latino Black or white person recorded. No violation code is required. Both period-specific gaps exclude zero; that does not mean their difference excludes zero.")
p('Reading this report', 'h2')
p('2 / Study design and model<br/>3-4 / All 16 sensitivity specifications<br/>5 / Annual citywide results<br/>6 / Young men compared with other adults<br/>7 / District context<br/>8 / Limits and research sources<br/>9 / Findings and handoff for the next agent<br/>10 / Arrest-rate graph handoff and verification', 'small')
p('Data vintage: July 20, 2026 backup. Full calendar years end in 2025; the dashboard cubes currently extend through Q2 2026. The before/after comparison describes an association and does not identify an effect caused by the law.', 'small')

section(2, 'How the comparison is built')
p('Time and lighting', 'h2')
p('Raw timestamps are UTC and are converted to America/New_York before selecting local dates and evening times. The inter-twilight comparison window is derived from Philadelphia solar geometry (approximately 5:05-8:33 p.m.). Daylight ends at sunset; darkness begins at civil dusk. The ambiguous interval between them is excluded.')
p('Before: January 1, 2014-March 2, 2022. After: March 3, 2022-December 31, 2025. Both endpoints are included. The year 2020 is excluded because lockdowns and curfews disrupted evening travel. Partial years are excluded from these models.')
p('Sample and recorded occupancy', 'h2')
p('The main model includes vehicle stops in 21 residential police districts. Every recorded person must be at least 18 and have recorded race and Male/Female gender; officer assignment must be present. Duplicated person rows are removed by objectid. There is no arrest exclusion.')
p('Occupancy is inferred from vehicle records sharing a timestamp and location. The export does not reliably identify the driver or everyone physically in the car. A sole-occupant stop means one person recorded; multi-person outcomes describe the recorded occupants. Unrelated nearby stops can be merged by this rule.')
p('Adjustment and uncertainty', 'h2')
p('A weighted binomial model adjusts for clock time (a six-degree-of-freedom natural spline), weekday, year, district-qualified police service area, assigned police unit, and summer. The before/after comparison fits darkness, post-law period, and their interaction in one model. Predictions under daylight and darkness are averaged over the same rows to report percentage-point effects and their direct difference.')
p('Seasonality weights use p(1-p), plus the mean raw weight as a floor, where p is the daylight share within the evening window, excluding sunset-to-dusk minutes. This emphasizes dates with both light and dark exposure. Sparse assignment and area levels with fewer than 100 stops are pooled into OTHER.')
p('A confidence interval touching or crossing zero does not establish a difference. Period-specific intervals test each daylight-darkness gap; the direct difference interval tests whether that gap changed after the law.', 'small')

for number, universe, title in [(3,'black_white','Black and white occupants'),(4,'all_races','Occupants of all races')]:
    section(number, title)
    p('Sensitivity to violation-code and occupant rules', 'h2')
    p('Each row is a separate fitted specification. Effects are percentage points: darkness minus daylight. Change is after minus before. Every stop counts once. All 16 direct change intervals cross zero.', 'small')
    fits = [f for f in C['sensitivity'] if f['universe']==universe]
    rows = []
    for f in fits:
        z=f['result']; rows.append([label(f), 'Required' if f['require_mvc'] else 'Not required', f"{z['n']:,}", f"{z['effects']['reference']['effect_pp']:.2f}", f"{z['effects']['group']['effect_pp']:.2f}", f"{signed(z['difference_pp'])}\n[{ci(z)}]"])
    table(['Recorded occupants','MVC code','Stops','Before','After','Change [95% CI]'],rows,[100,70,64,50,50,170])
    p('How to read the definitions', 'h2')
    p('Sole occupant: one person recorded. Anyone Black: at least one recorded occupant is non-Latino Black. Majority Black: more than half; a 50/50 stop is retained as no Black majority. Everyone Black: all recorded occupants are non-Latino Black.')
    p(('Only non-Latino Black and white occupants enter this universe.' if universe=='black_white' else 'All recorded racial categories enter this universe. The reference includes every stop failing the selected Black-occupant rule; it is not a white-only comparison.')+' Black means non-Latino Black in every specification.')
    p('A code on any recorded occupant satisfies the MVC requirement. The literal string NA counts as recorded; an empty value does not. Removing the code requirement matters because recording coverage changed from 2023 onward.', 'small')

section(5, 'The annual citywide pattern')
pool=B['race_composition_pooled']
p(f"In the supporting sample, the adjusted Black share was <b>{pool['marginal_daylight_pct']:.1f}% in daylight</b> and <b>{pool['marginal_dark_pct']:.1f}% after dark</b>. The pooled change is {pool['marginal_effect_pp']:.2f} points (95% interval {pool['marginal_ci_lo_pp']:.2f} to {pool['marginal_ci_hi_pp']:.2f}), across {pool['n']:,} stops.")
annual=B['race_composition_overall']
adults=[z for z in annual if z['sample']=='all_adults']
story.append(chart([(name,col,[(z['year'],z[key]) for z in adults]) for name,col,key in [('In daylight',PURPLE,'marginal_daylight_pct'),('After dark',VIOLET,'marginal_dark_pct')]],70,90,[70,75,80,85,90],'Year','Black share of Black and white drivers stopped (%)'))
p('Annual estimates are adjusted to compare stops at the same times of day, days of the week, seasons, and locations. Gray points show 2020 for context; it is excluded from the pooled result.', 'small')
p('Why this sample differs from the main result', 'h2')
p('These annual, subgroup, and district analyses require a recorded violation code and use the older grouping of vehicle and pedestrian records before inferring sole occupancy. The newer sensitivity builder groups vehicle records only. With the code rule held fixed, that correction adds a net 861 qualifying sole-occupant stops (468,478 versus 467,617) and moves period estimates by less than 0.02 points.')
p('The pooled result is one combined fit, not an average of annual dots. Individual years have less information: five of eleven comparable annual intervals cannot rule out no gap. Changes in code recording also mean annual fluctuations cannot automatically be read as changes in enforcement.')

section(6, 'Is the pattern stronger for young men?')
young=B['race_composition_young_men_pooled']; yp=young['pooled']; yd=young['difference']
p(f"For men ages 18-29, the Black share was {yp['marginal_daylight_pct']:.1f}% in daylight and {yp['marginal_dark_pct']:.1f}% after dark, a {abs(yp['marginal_effect_pp']):.2f}-point drop. The sample contains {yp['n']:,} stops of young men.")
series=[]
for sample,name,col in [('all_adults','All adults',PURPLE),('young_male','Men ages 18-29',VIOLET)]:
    series.append((name,col,[(z['year'],z['marginal_effect_pp'],z['marginal_ci_lo_pp'],z['marginal_ci_hi_pp']) for z in annual if z['sample']==sample]))
story.append(chart(series,-8,4,[-8,-6,-4,-2,0,2,4],'Year','Change in Black share (percentage points)',intervals=True))
p('Bars show 95% confidence intervals. Negative values mean a smaller Black share after dark. Gray points show 2020. The law took effect March 3, 2022, within the 2022 calendar-year point.', 'small')
p('The direct comparison matters', 'h2')
p(f"In a single interaction model, the drop for young men was {abs(yd['difference_pp']):.2f} points larger than for <b>other adults</b> (95% interval {ci(yd)}). Other adults are the proper comparison because the all-adult series already includes young men. Shared controls mean these group estimates need not subtract exactly to the differences between separately fitted models.")
p('Young men have fewer observations and wider intervals. The positive 2025 point has an interval crossing zero; it does not establish a reversal. Comparing two plotted points or overlapping intervals is not a direct statistical test.', 'small')

section(7, 'What district context tells us')
district=B['district_blackness_moderation']
p('The models do not detect a clear relationship between a district\'s Black population and the after-dark change for young men, young women, older men, or older women. District population describes the place where a stop occurred, not the driver.')
names={'young_male':'Men 18-29','young_female':'Women 18-29','older_male':'Men 30+','older_female':'Women 30+'}
g=district['groups'][0]
story.append(chart([(names[g['group']],PURPLE,[(z['district_black_pct'],z['effect_pp'],z['effect_ci_lo_pp'],z['effect_ci_hi_pp']) for z in g['effects']])],-4,0,[-4,-3,-2,-1,0],'District residents who are Black (%)','Modeled change in Black share (percentage points)',intervals=True))
p('Illustration: young men. One pooled model traces a continuous interaction with district Black population; the plotted 10%-80% values summarize that model. Bars show 95% confidence intervals.', 'small')
table(['Group','Stops','Interaction p-value'],[[names[z['group']],f"{z['n']:,}",f"{z['interaction_p_value']:.3f}"] for z in district['groups']],[220,130,154])
p('Where most residents are Black, the Black share of stops is already near 100%, limiting how far it can move. A non-significant interaction does not prove that districts are identical. Police service areas must use district-qualified keys (for example 02-1); raw PSA numbers are reused across districts.', 'small')

section(8, 'Interpretation, limits &amp; sources')
p('What the test can support', 'h2')
p('At comparable evening hours, a smaller Black share after dark is consistent with visibility-dependent selection. Darkness only partly conceals a driver: streetlights, headlights, and following a car can reveal occupants. The design is often treated as conservative for that reason. It still depends on assumptions about who is on the road and how travel varies with season, time, and lighting.')
p('These are shares among recorded stops. They do not measure an individual\'s probability of being stopped, quantify all racial bias, or establish an individual officer\'s motives. A one-point decline means, for example, 80% to 79%; it does not mean 1% fewer stops.')
p('What remains uncertain', 'h2')
p('The law did not randomly assign stops to before and after periods. Travel patterns, enforcement, and recording practices also changed. Neither the main result nor sensitivity checks establish a causal effect of Driving Equality. Confidence intervals capture model uncertainty, not every possible source of bias or recording error.')
p('Open Data Philly backfills records. Stop grouping can over-merge unrelated events, recorded occupants may omit people in a car, and a sole recorded person is not a validated driver indicator. MVC-code availability changes over time. The broader no-code main sample reduces dependence on that recording rule; it does not eliminate all selection problems.')
p('Research and data sources', 'h2')
p('Philadelphia Police Department vehicle/pedestrian records via Open Data Philly; July 20, 2026 backup. District demographics use Census inputs; daylight and darkness use Philadelphia solar times.', 'small')
p('Hannon, Neal &amp; Gustafson (2021), <i>Out-of-Place and In-Place Policing</i>:<br/><link href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3628865" color="#603285">papers.ssrn.com/sol3/papers.cfm?abstract_id=3628865</link>', 'small')
p('Knode, Wolfe &amp; Carter (2024), seasonality weights, supplemental S.2:<br/><link href="https://doi.org/10.1111/1745-9125.12366" color="#603285">doi.org/10.1111/1745-9125.12366</link>', 'small')
p('Related reproductions retained in the pipeline:<br/>Hannon &amp; Biddle (2025), <i>Unequal Policing of Black Motorists in Black Communities by Age and Gender</i>, doi:10.1007/s12103-025-09879-8.<br/>Hannon &amp; Biddle (2026), <i>Are Young Black Men Traveling Together Targeted for Traffic Stops?</i>, doi:10.21428/cb6ab371.f1d81a4b. These use different outcomes and samples; they must not be confused with the main racial-composition comparison.', 'small')

section(9, 'Handoff: what we learned')
p('Findings and decisions to preserve', 'h2')
p('<b>The gap persists; a change after the law is not established.</b> The main no-code sole-occupant comparison uses 483,531 stops. Its pre/post difference is +0.18 points [-0.25, +0.61]. None of the 16 alternative specifications establishes a change. Young men show a larger pooled after-dark drop than other adults in the narrower supporting sample. District moderation is not clearly detected.')
p('<b>The main result now lives on Snapshot.</b> components/VeilSummary.vue is mounted in pages/snapshot.vue at #veil-of-darkness. The old /veil-of-darkness route redirects there. Snapshot has no methods link. Supporting interactive work remains at /veil-sensitivity; this PDF carries the methods and results for sharing.')
p('Where the next agent should work', 'h2')
p('Main figures: public/cubes/veil-comparison.json; useVeilComparison fetches it with markRaw. Main display: components/VeilSummary.vue. Supporting display: pages/veil-sensitivity.vue and components/VeilSensitivityComparison.vue. Statistical preparation: pipeline/veil/sensitivity.py, models.py, seasonality.py, and sun.py. Cube publication: pipeline/cube_builders/veil_comparison.py and scripts/update-data.mjs. PDF source: scripts/build-veil-methods-pdf.py.', 'small')
p('Checks: tests/veil-page.test.ts pins model-driven headlines, dates, intervals, and sensitivity controls. e2e/config.mjs checks the rendered Snapshot result. Run unit tests plus a clean production build and browser checks after changing page computations or cube consumers. Stop nuxt dev first to avoid .nuxt build races. Preserve markRaw and existing load/interaction budgets.', 'small')
p('Data refresh and known traps', 'h2')
p('Current dashboard data ends at Q2 2026. Read-only checks on October 18 found public stops through October 3 and shootings through October 15; Q3 is a candidate for the next refresh. Only the July 20 backup was local. The next scheduled backup is October 20 and must be downloaded from the private PAU Drive folder into pipeline/data/. Confirm its summaries before running update-data. A new quarter does not add a full daylight cycle to the annual veil models.', 'small')
p('Convert UTC before local-date filtering; read neighboring UTC years at boundaries. Preserve literal MVC code NA. Qualify PSA with district. Stable backup row ordering is essential for dashboard driver selection; late reporting can legitimately change recent quarters. Fit significance from the direct difference interval, never from separate period intervals or overlapping whiskers.', 'small')
p('Workspace warning: this work began amid many existing uncommitted changes, including arrest-rate graphs, veil models, cubes, and e2e checks. Those changes were preserved. Review the full working tree before committing; do not discard files to remove temporary instrumentation. This report is a dated handoff, not an automatically refreshed statement of future repository state.', 'small')

section(10, 'Arrest-rate graphs: working notes')
p('Three related questions, three rates', 'h2')
p('The new Neighborhoods graphs compare Black and White drivers over time: contraband found per intrusion, arrests during intrusions per intrusion, and arrests per traffic stop. They follow the location and quarter selectors. Every stop counts once, even when police arrest more than one person. An intrusion means a frisk or search of a person or vehicle.')
table(['Graph', 'Numerator', 'Denominator'], [
    ['Contraband hit rate', 'n_contraband', 'n_intruded'],
    ['Arrests during intrusions', 'n_arrested_intruded', 'n_intruded'],
    ['Arrests across all stops', 'n_arrested', 'n_stopped'],
], [164,170,170])
p('<b>The joint count is load-bearing.</b> Total arrests cannot be divided by intrusions to estimate arrests during intrusions: some arrests have no recorded frisk or search. n_arrested_intruded counts the intersection at stop level. A passenger arrest counts toward the stop, but the demographic grouping uses the pipeline\'s assigned driver race.')
p('Annual values and partial years', 'h2')
p('utils/neighborhoods.ts aggregates numerator and denominator counts within each year, then divides; it does not average quarterly percentages. Black and White annual series retain partial years with dashed segments and hover explanations. A year is incomplete if quarters are missing from the cube or the selected date range cuts off part of it. Zero denominator means no point, rather than a zero rate.')
p('Files and verification', 'h2')
p('Display: pages/neighborhoods.vue, anchors #arrest-rate, #all-stops-arrest-rate, and #hit-rates-over-time. Aggregation: utils/neighborhoods.ts. Pipeline: pipeline/update_db_models.py and pipeline/cube_builders/stops.py. Data: public/cubes/stops.json. Regression tests: pipeline/tests/test_intrusion_arrests.py, utils/neighborhoods.test.ts, and e2e/config.mjs.', 'small')
p('After a refresh, recheck Snapshot\'s original charts, the pre/post denominator and intervals, absence of methods links, and the old-route redirect. Run unit tests and a clean static build with browser invariants.', 'small')
p('Verified October 18: 52 unit tests passed across veil-page, veil, and neighborhoods tests. A clean static generation and browser invariant checks passed for Snapshot and veil-sensitivity. Load blocking was 89 ms and 0 ms against unchanged budgets of 150 ms and 60 ms. Desktop/mobile rendering and the old-route redirect were checked. Mutating the rendered denominator or restoring the methods-link wording correctly failed the Snapshot invariant.', 'small')
p('Do not infer a causal story from differences between these denominators. The all-stops arrest rate answers a different question from the arrest rate conditional on an intrusion. Preserve the headings and denominator explanations when editing the graphs.', 'small')

def furniture(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D8CDDF'))
    canvas.line(54, 45, 558, 45)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor(MUTED))
    canvas.drawString(54, 31, 'DRIVING EQUALITY  /  Philadelphia  /  October 2026')
    canvas.drawRightString(558, 31, f'{doc.page:02}')
    canvas.restoreState()

OUT.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(OUT), pagesize=(612,792), rightMargin=54, leftMargin=54, topMargin=48, bottomMargin=63,
                  title='Veil of Darkness - Methods, Sensitivity Results and Handoff', author='Driving Equality dashboard').build(story,onFirstPage=furniture,onLaterPages=furniture)
print(OUT)

"""Render the completed experimental fits as a standalone report with R plots."""
import csv
import html
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "reports"
LABELS = {"any_black": "Anyone Black", "majority_black": "Majority Black", "all_black": "Everyone Black"}


def main():
    data = json.loads((REPORTS / "veil-sensitivity.json").read_text())
    assert len(data["results"]) == 16
    reference = json.loads((REPORTS / "veil-sensitivity-reference.json").read_text())
    assert reference["published_reference_reproduced"]
    rows = []
    for item in data["results"]:
        r = item["result"]
        assert r["converged"]
        label = "Sole occupant" if item["occupancy"] == "sole" else LABELS[item["rule"]]
        row = {"universe": item["universe"], "rule": label,
               "mvc": "Recorded MVC" if item["require_mvc"] else "All vehicle stops",
               "n": r["n"], "multi": item["multi_person_stops"], "ties": item["half_black_stops"]}
        for side, key in (("before", "reference"), ("after", "group")):
            e = r["effects"][key]
            row.update({side: e["effect_pp"], side + "_lo": e["effect_ci_lo_pp"], side + "_hi": e["effect_ci_hi_pp"]})
        row.update(change=r["difference_pp"], change_lo=r["difference_ci_lo_pp"], change_hi=r["difference_ci_hi_pp"], p=r["difference_p_value"])
        assert all(math.isfinite(row[k]) for k in ("before", "after", "change", "change_lo", "change_hi", "p"))
        rows.append(row)
    with (REPORTS / "veil-sensitivity.csv").open("w") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
    subprocess.run(["Rscript", str(Path(__file__).with_name("plot_veil_sensitivity.R")), str(REPORTS)], check=True)
    sections = []
    markdown = ["# Veil-of-darkness sensitivity", "", "All effects are percentage points, dark minus daylight. Change is after minus before; brackets show its 95% confidence interval.", ""]
    for universe, title in (("black_white", "Non-Latino Black/white occupants only"), ("all_races", "Occupants of all races")):
        table = []
        markdown.extend([f"## {title}", "", "| Definition | Stop reasons | Stops | Before | After | Change [95% CI] |", "|---|---|---:|---:|---:|---:|"])
        for row in [r for r in rows if r["universe"] == universe]:
            values = [row["rule"], row["mvc"], f'{row["n"]:,}', f'{row["before"]:+.2f}', f'{row["after"]:+.2f}', f'{row["change"]:+.2f} [{row["change_lo"]:+.2f}, {row["change_hi"]:+.2f}]']
            table.append("<tr>" + "".join(f"<td>{html.escape(v)}</td>" for v in values) + "</tr>")
            markdown.append("| " + " | ".join(values) + " |")
        markdown.append("")
        sections.append(f'''<section><h2>{title}</h2><img src="veil-sensitivity-{universe}.svg" alt="Before, after, and change estimates with 95% confidence intervals for all eight specifications"/>
        <div class="table-wrap"><table><thead><tr><th>Definition</th><th>Stop reasons</th><th>Stops</th><th>Before</th><th>After</th><th>Change [95% CI]</th></tr></thead><tbody>{''.join(table)}</tbody></table></div></section>''')
    notes = """Black means non-Latino Black in every specification. In the all-races version, the comparison includes every other recorded racial category. Every stop counts once. Majority means more than half; ties count as no Black majority. All recorded people must be adults with recorded age, gender and race. The three occupancy outcomes concern people recorded at the stop, not necessarily everyone in the car or the driver's race. Years: 2014–2019 and 2021–2025; the policy split is March 3, 2022. Controls and seasonality weights are held fixed across specifications. A recorded MVC code on any occupant satisfies the MVC rule; the literal NA counts as recorded."""
    cleanup = """The published reference was reproduced exactly. Its before/after gaps are −1.11 and −0.83 points, with a change of +0.28 [−0.16, +0.71]. The experiments explicitly group vehicle records only, adding 862 sole-occupant vehicle stops that the existing builder excluded through coincident pedestrian records and dropping one previously included observation (a net addition of 861). This moves the baseline period estimates by less than 0.02 points. The same vehicle-only grouping is used throughout this experiment."""
    markdown.extend([notes, "", cleanup, "", "These comparisons do not establish whether Driving Equality caused any change."])
    (REPORTS / "veil-sensitivity.md").write_text("\n".join(markdown) + "\n")
    doc = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Veil-of-darkness sensitivity</title><style>body{{font:17px/1.55 system-ui;color:#272236;max-width:1200px;margin:40px auto;padding:0 24px;background:#faf9fc}}h1{{font-size:36px;line-height:1.2}}h2{{font-size:25px}}section{{background:white;border:1px solid #ded8e8;border-radius:12px;padding:24px;margin:28px 0}}img{{width:100%;height:auto}}.table-wrap{{overflow:auto}}table{{border-collapse:collapse;width:100%;font-size:15px}}th,td{{padding:10px;text-align:right;border-bottom:1px solid #eee}}th:first-child,td:first-child,th:nth-child(2),td:nth-child(2){{text-align:left}}.note{{color:#544c63;font-size:15px}}a{{color:#603f9c}}</style>
    <main><p><a href="/veil-of-darkness#time-and-place">← Veil-of-darkness page</a> · Experimental sensitivity analysis</p><h1>Do the MVC and occupant rules change the result?</h1>
    <p>Negative values mean a smaller share of stops meeting that row’s Black-occupant definition after dark. The final panel tests whether that gap changed after Driving Equality. Bars are 95% confidence intervals; a change interval crossing zero does not establish a pre/post difference.</p>
    {''.join(sections)}<h2>What these comparisons include</h2><p class="note">{notes}</p><p class="note">{cleanup}</p><p class="note">These comparisons do not establish whether Driving Equality caused any change.</p></main></html>'''
    (REPORTS / "veil-sensitivity.html").write_text(doc)


if __name__ == "__main__":
    main()

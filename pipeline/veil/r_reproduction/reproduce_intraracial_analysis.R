#!/usr/bin/env Rscript

# Hannon & Biddle (2025): intraracial veil-of-darkness reproduction
# ==================================================================
#
# Reproduces Table 1's six weighted quasi-binomial models and Figure 1's
# adjusted probabilities in R. The implementation follows the published
# methods:
#
#   * Black adult sole occupants stopped for MVC violations
#   * majority-Black Philadelphia police districts
#   * inter-twilight stops, excluding the sunset-to-civil-dusk interval
#   * darkness, a six-df natural spline for clock time, and fixed effects for
#     weekday, year, police area, assigned unit, and summer
#   * the Knode et al. quadratic seasonality weight
#   * quasibinomial GLMs
#   * ggeffects predictions at numeric means and factor reference categories
#
# The adjacent CSV is already the final model-ready sample. It is
# bundled because the source backup is not publicly downloadable and rebuilding
# it requires the Python extraction pipeline. No Python or database is needed
# to run this R reproduction.
#
# Usage:
#
#   install.packages(c("ggeffects", "marginaleffects"))  # once
#   Rscript reproduce_intraracial_analysis.R
#
# An explicit sample path can be supplied as the sole argument.

required_packages <- c("ggeffects", "marginaleffects")
missing_packages <- required_packages[
  !vapply(required_packages, requireNamespace, logical(1L), quietly = TRUE)
]
if (length(missing_packages) > 0L) {
  stop(
    "Missing R package(s): ", paste(missing_packages, collapse = ", "),
    ". Install with: install.packages(c(\"ggeffects\", \"marginaleffects\"))",
    call. = FALSE
  )
}

args <- commandArgs(trailingOnly = TRUE)
if (length(args) > 1L) {
  stop(
    "Usage: Rscript reproduce_intraracial_analysis.R ",
    "[/path/to/veil_intraracial_sample.csv]",
    call. = FALSE
  )
}

script_argument <- grep("^--file=", commandArgs(trailingOnly = FALSE), value = TRUE)
script_path <- if (length(script_argument) == 1L) {
  normalizePath(sub("^--file=", "", script_argument), mustWork = TRUE)
} else {
  normalizePath("reproduce_intraracial_analysis.R", mustWork = TRUE)
}
sample_path <- if (length(args) == 1L) {
  args[[1L]]
} else {
  file.path(dirname(script_path), "veil_intraracial_sample.csv")
}
if (!file.exists(sample_path)) {
  stop("Sample file does not exist: ", sample_path, call. = FALSE)
}

sample1 <- read.csv(sample_path, stringsAsFactors = FALSE)

outcomes <- c(
  "is_young",
  "is_male",
  "young_male",
  "young_female",
  "older_male",
  "older_female"
)
controls <- c(
  "obscured_view", "clock_minutes", "dow", "year", "police_area",
  "assigned_unit", "is_summer", "weight"
)
missing_columns <- setdiff(c(outcomes, controls), names(sample1))
if (length(missing_columns) > 0L) {
  stop(
    "Sample is missing required columns: ",
    paste(missing_columns, collapse = ", "),
    call. = FALSE
  )
}

# Match the reproduction pipeline's protection against separated estimates
# from extremely sparse assigned-unit or police-area levels.
collapse_rare <- function(x, minimum = 100L) {
  x <- as.character(x)
  counts <- table(x)
  rare <- names(counts[counts < minimum])
  x[x %in% rare] <- "OTHER"
  factor(x)
}

sample1$police_area <- collapse_rare(sample1$police_area)
sample1$assigned_unit <- collapse_rare(sample1$assigned_unit)

# The paper says factor controls were held at their omitted reference
# categories but does not identify those categories or publish its model code.
# On this later data vintage, R's default alphabetical references yield 18.7%
# and 15.3% for young men, far from the paper's 26% and 22%. Releveling each
# control to its most common category yields 26.1% and 21.7% and reproduces the
# other Figure 1 panels as well. We therefore use modal omitted categories as
# an explicit, evidence-based inference rather than silently presenting R's
# arbitrary alphabetical levels as the authors' choices.
mode_value <- function(x) {
  names(which.max(table(x)))
}

factor_with_modal_reference <- function(x) {
  stats::relevel(factor(x), ref = mode_value(x))
}

sample1$dow <- factor_with_modal_reference(sample1$dow)
sample1$year <- factor_with_modal_reference(sample1$year)
sample1$police_area <- factor_with_modal_reference(sample1$police_area)
sample1$assigned_unit <- factor_with_modal_reference(sample1$assigned_unit)
sample1$is_summer <- factor_with_modal_reference(sample1$is_summer)

reference_categories <- c(
  dow = levels(sample1$dow)[[1L]],
  year = levels(sample1$year)[[1L]],
  police_area = levels(sample1$police_area)[[1L]],
  assigned_unit = levels(sample1$assigned_unit)[[1L]],
  is_summer = levels(sample1$is_summer)[[1L]]
)

fit_outcome <- function(outcome) {
  formula <- reformulate(
    c(
      "obscured_view",
      "splines::ns(clock_minutes, df = 6)",
      "dow", "year", "police_area", "assigned_unit", "is_summer"
    ),
    response = outcome
  )
  glm(
    formula,
    family = quasibinomial(),
    weights = weight,
    data = sample1
  )
}

fits <- setNames(lapply(outcomes, fit_outcome), outcomes)

paper_coefficients <- c(
  is_young = -0.17,
  is_male = -0.21,
  young_male = -0.23,
  young_female = 0.05,
  older_male = -0.01,
  older_female = 0.25
)
paper_standard_errors <- c(
  is_young = 0.02,
  is_male = 0.02,
  young_male = 0.02,
  young_female = 0.03,
  older_male = 0.02,
  older_female = 0.02
)

table1_row <- function(outcome) {
  coefficient_table <- summary(fits[[outcome]])$coefficients
  estimate <- coefficient_table["obscured_view", "Estimate"]
  standard_error <- coefficient_table["obscured_view", "Std. Error"]
  p_value <- coefficient_table["obscured_view", "Pr(>|t|)"]
  data.frame(
    outcome = outcome,
    n = nobs(fits[[outcome]]),
    coefficient = estimate,
    standard_error = standard_error,
    odds_ratio = exp(estimate),
    p_value = p_value,
    paper_coefficient = paper_coefficients[[outcome]],
    paper_standard_error = paper_standard_errors[[outcome]],
    row.names = NULL
  )
}
table1 <- do.call(rbind, lapply(outcomes, table1_row))

# Figure 1: this is the paper's stated conversion from coefficients to
# probabilities. ggeffects holds numeric controls at their means and factors
# at their omitted reference categories by default.
figure_outcomes <- c("young_male", "young_female", "older_male", "older_female")
figure1_row <- function(outcome) {
  prediction <- as.data.frame(
    ggeffects::ggpredict(fits[[outcome]], terms = "obscured_view")
  )
  data.frame(
    outcome = outcome,
    obscured_view = as.numeric(as.character(prediction$x)),
    lighting = ifelse(as.numeric(as.character(prediction$x)) == 0, "daylight", "dark"),
    probability = prediction$predicted,
    percent = 100 * prediction$predicted,
    conf_low = prediction$conf.low,
    conf_high = prediction$conf.high,
    row.names = NULL
  )
}
figure1 <- do.call(rbind, lapply(figure_outcomes, figure1_row))

# Separate diagnostic: true sample-average marginal predictions. These are
# not substituted for Figure 1; they answer a different standardisation
# question and are printed solely to make that distinction auditable.
average_marginal_row <- function(outcome) {
  prediction <- marginaleffects::avg_predictions(
    fits[[outcome]],
    variables = list(obscured_view = c(0, 1))
  )
  data.frame(
    outcome = outcome,
    obscured_view = prediction$obscured_view,
    lighting = ifelse(prediction$obscured_view == 0, "daylight", "dark"),
    probability = prediction$estimate,
    percent = 100 * prediction$estimate,
    row.names = NULL
  )
}
average_marginal <- do.call(rbind, lapply(figure_outcomes, average_marginal_row))

cat("\nHannon & Biddle (2025) intraracial veil-of-darkness reproduction\n")
cat("================================================================\n")
cat(sprintf("Analysis sample: %s stops\n\n", format(nrow(sample1), big.mark = ",")))
cat("Inferred omitted reference categories used for Figure 1:\n")
for (control in names(reference_categories)) {
  cat(sprintf("  %-14s %s\n", control, reference_categories[[control]]))
}
cat("\n")

cat("Table 1 reproduction\n")
print(
  transform(
    table1,
    coefficient = round(coefficient, 3),
    standard_error = round(standard_error, 3),
    odds_ratio = round(odds_ratio, 3),
    p_value = signif(p_value, 3)
  ),
  row.names = FALSE
)

cat("\nFigure 1 reproduction using ggeffects mean/reference predictions\n")
print(
  transform(figure1, percent = round(percent, 1))[
    , c("outcome", "lighting", "percent")
  ],
  row.names = FALSE
)

cat("\nSeparate diagnostic: average marginal predictions\n")
print(
  transform(average_marginal, percent = round(percent, 1))[
    , c("outcome", "lighting", "percent")
  ],
  row.names = FALSE
)

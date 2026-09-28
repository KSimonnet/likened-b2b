import { getLeafValue } from "@ksimonnet/utils/core/manip-node/modules/get-leaf-value.js";
import { updateCardContentTable } from "./update-card-content-table.js";

// ---------------------------------------------------------------------------
// Data processors — transform raw card data into Chart.js-ready structures
// ---------------------------------------------------------------------------

export const ChartDataProcessor = {
  // Extract budget values: "$180M annual R&D investment, $45M in Data Science"
  processProjectBudget: (budgetObj) => {
    const {
      data_science,
      software_development,
      gen_ai,
      marketing,
      operations,
      other
    } = budgetObj;

    return {
      labels: [
        "Data Science",
        "Software Development",
        "Gen AI",
        "Marketing",
        "Operations",
        "Other"
      ],
      data: [
        data_science,
        software_development,
        gen_ai,
        marketing,
        operations,
        other
      ],
      colors: ["#6366f1", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#e5e7eb"]
    };
  },

  processGrowthRates: (revenueGrowth, headcountGrowth) => {
    const revenueValue = revenueGrowth
      ? parseInt(revenueGrowth.replace("%", ""))
      : 35;
    const headcountValue = headcountGrowth
      ? parseInt(headcountGrowth.replace("%", ""))
      : 28;

    return {
      labels: ["Revenue Growth", "Headcount Growth"],
      data: [revenueValue, headcountValue],
      colors: ["#22c55e", "#3b82f6"],
      backgroundColor: ["rgba(34, 197, 94, 0.2)", "rgba(59, 130, 246, 0.2)"]
    };
  },

  processFundingReceived: (fundingObj) => {
    const { seed, Series_a, series_b, series_c, series_d, series_e, series_f } =
      fundingObj;

    let labels = [];
    let data = [];

    if (seed) {
      labels.push("Seed");
      data.push(seed);
    }

    if (Series_a) {
      labels.push("Series A");
      data.push(Series_a);
    }

    if (series_b) {
      labels.push("Series B");
      data.push(series_b);
    }

    if (series_c) {
      labels.push("Series C");
      data.push(series_c);
    }

    if (series_d) {
      labels.push("Series D");
      data.push(series_d);
    }

    if (series_e) {
      labels.push("Series E");
      data.push(series_e);
    }

    if (series_f) {
      labels.push("Series F");
      data.push(series_f);
    }

    // Convert to cumulative values for funding progression
    const cumulativeData = [];
    let cumulative = 0;

    data.forEach((value) => {
      cumulative += value;
      cumulativeData.push(cumulative);
    });

    return {
      labels: labels,
      data: cumulativeData,
      colors: "#8b5cf6"
    };
  },

  // Extract rating: "4.3/5.0 (Glassdoor)"
  processEmployeeReviews: (reviewText) => {
    const ratingMatch = reviewText.match(/(\d+\.\d+)\/5\.0/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.3;

    return {
      rating: rating,
      maxRating: 5,
      fullStars: Math.floor(rating),
      halfStar: rating % 1 >= 0.5,
      emptyStars: 5 - Math.ceil(rating)
    };
  },

  // Extract score: "78/100"
  processWellBeingScore: (scoreText) => {
    const scoreMatch = scoreText.match(/(\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 78;

    return {
      labels: ["Well-being Score", "Remaining"],
      data: [score, 100 - score],
      colors: ["#10b981", "#f3f4f6"]
    };
  }
};

// ---------------------------------------------------------------------------
// Renderers — produce Chart.js instances or DOM widgets from processed data
// ---------------------------------------------------------------------------

export const ChartRenderer = {
  renderPieChart: (canvasId, chartData, title) => {
    const ctx = document.getElementById(canvasId).getContext("2d");
    const chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.data,
            backgroundColor: chartData.colors,
            borderWidth: 2,
            borderColor: "#ffffff"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 14, weight: "bold" }
          },
          legend: {
            position: "bottom",
            labels: { padding: 10, font: { size: 12 } }
          }
        }
      }
    });
    return chart;
  },

  renderBarChart: (canvasId, chartData, title, yAxisLabel) => {
    const ctx = document.getElementById(canvasId).getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: yAxisLabel,
            data: chartData.data,
            backgroundColor: chartData.backgroundColor,
            borderColor: chartData.colors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 14, weight: "bold" }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(...chartData.data) + 10,
            grid: { color: "#e5e7eb" },
            ticks: {
              font: { size: 11 },
              callback: function (value) {
                return value + "%";
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
    return chart;
  },

  renderTimeSeries(canvasId, fundingData, title) {
    const fundingEntries = Object.entries(fundingData);

    // Format labels (capitalize and clean up series names)
    const labels = fundingEntries.map(([round]) => {
      return round
        .replace(/_/g, " ")
        .replace(/series/i, "Series")
        .replace(/^(\w)/, (match) => match.toUpperCase());
    });

    // Get funding amounts
    const amounts = fundingEntries.map(([, amount]) => amount);

    const ctx = document.getElementById(canvasId).getContext("2d");

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Funding Amount",
            data: amounts,
            borderColor: "#3b82f6",
            backgroundColor: "#3b82f620",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: "bold" },
            padding: 20
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: function (context) {
                return context[0].label + " Round";
              },
              label: function (context) {
                const value = context.parsed.y;
                return `Funding Amount: $${value}M`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Funding Rounds",
              font: { size: 12, weight: "bold" }
            },
            grid: {
              color: "#f3f4f6",
              display: true
            },
            ticks: {
              font: { size: 11 },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Funding Amount ($ Millions)",
              font: { size: 12, weight: "bold" }
            },
            grid: {
              color: "#e5e7eb"
            },
            ticks: {
              font: { size: 11 },
              callback: function (value) {
                return "$" + value + "M";
              }
            }
          }
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        elements: {
          point: {
            hoverRadius: 8,
            hoverBorderWidth: 3
          }
        }
      }
    });
    return chart;
  },

  renderStarRating: (containerId, ratingData) => {
    const container = document.getElementById(containerId);
    const { rating, fullStars, halfStar, emptyStars } = ratingData;

    let starsHTML = "";

    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<span class="star--filled">★</span>';
    }

    if (halfStar) {
      starsHTML += '<span class="star--filled">☆</span>';
    }

    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<span class="star--empty">☆</span>';
    }

    container.innerHTML = `
      <div class="star-rating">
        <div>${starsHTML}</div>
        <span class="rating-label">${rating}/5.0</span>
      </div>
    `;
  }
};

// ---------------------------------------------------------------------------
// CHART_REGISTRY — Strategy pattern: maps section_name to processor+renderer pair.
// Each entry is the single source of truth for how a given data section is visualised.
// Adding a new chart section = adding one entry here, no other changes needed.
// ---------------------------------------------------------------------------

const CHART_REGISTRY = {
  r_and_d_budget: (element, data) =>
    ChartRenderer.renderPieChart(
      element.id,
      ChartDataProcessor.processProjectBudget(data),
      "R&D Budget Allocation"
    ),

  growth_rates: (element, data) =>
    ChartRenderer.renderBarChart(
      element.id,
      ChartDataProcessor.processGrowthRates(
        data.yoy_revenue_growth_rate,
        data.yoy_headcount_growth_rate
      ),
      "Year-over-Year Growth Rates",
      "Growth Percentage"
    ),

  funding_history: (element, data) =>
    ChartRenderer.renderTimeSeries(element.id, data, "Funding History"),

  employee_wellbeing: (element, data) =>
    ChartRenderer.renderPieChart(
      element.id,
      ChartDataProcessor.processWellBeingScore(data),
      "Employee Well-being Score"
    ),

  employee_reviews: (element, data) => {
    ChartRenderer.renderStarRating(
      element.id,
      ChartDataProcessor.processEmployeeReviews(data)
    );
    return null;
  }
};

// ---------------------------------------------------------------------------
// Internal dispatcher
// ---------------------------------------------------------------------------

function renderChart(element, data, section_name) {
  if (element.chart) {
    element.chart.destroy();
    element.chart = null;
  }

  const handler = CHART_REGISTRY[section_name];

  if (!handler) {
    console.warn(
      `renderChart - No handler registered for section: "${section_name}"`
    );
    return;
  }

  const chart = handler(element, data);
  if (chart) element.chart = chart;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @description Dispatches card content updates to the appropriate renderer
 * based on element type (IMG → src, TBODY → table, everything else → chart registry).
 * Uses Strategy pattern via CHART_REGISTRY keyed by section_name.
 *
 * @param {Object} card - The data object for the current card
 * @param {Array<{id: string, path_segments: string[], section_name?: string, chart_type?: string}>} options - Render directives
 *
 * @returns {void}
 */
export function updateCardContent(card, options) {
  options.forEach(({ id, path_segments, section_name }) => {
    const target_elm = document.getElementById(id);
    if (!target_elm) return;

    const card_data = getLeafValue(card, path_segments);

    switch (target_elm.tagName) {
      case "IMG":
        target_elm.src = card_data;
        break;
      case "TBODY":
        updateCardContentTable(target_elm, card_data);
        break;
      default:
        if (section_name) {
          renderChart(target_elm, card_data, section_name);
        } else {
          console.warn(
            `updateCardContent - No handler for element: "${id}" (${target_elm.tagName})`
          );
        }
        break;
    }
  });
}

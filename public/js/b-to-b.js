import { animateStatCounter } from "../app/js/lib/animate-stat-counter.js";
import { AnimationManager } from "@ksimonnet/utils/web/classes/modules/animation-manager.js";
import { buildSVGOverlayOn } from "@ksimonnet/utils/web/manip-dom/modules/build-svg-overlay-on.js";
import { createSVGImage } from "@ksimonnet/utils/web/manip-dom/modules/create-svg-image.js";
import { createSVGRectangle } from "@ksimonnet/utils/web/manip-dom/modules/create-svg-rectangle.js";
import { setAttribute } from "@ksimonnet/utils/web/manip-dom/modules/set-attribute.js";

const AUTO_ADVANCE_INTERVAL_MS = 3000;
const MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const STATS_CAROUSEL_INTERVAL_NAME = "b2b-stats-carousel-auto-advance";
const TESTIMONIAL_CAROUSEL_INTERVAL_NAME =
  "b2b-testimonial-carousel-auto-advance";
const ICEBERG_AUTO_TOGGLE_INTERVAL_NAME =
  "b2b-hidden-candidate-market-auto-toggle";

const B2B_STATS_CARD_OL = Object.freeze([
  {
    before: {
      link: {
        href: "https://novoresume.com/career-blog/recruitment-statistics",
        source: "163+ Essential Recruitment Statistics to Know in 2026"
      },
      value: {
        value_type: "number",
        target: 30,
        suffix: "%"
      },
      label: "of a recruiter's day is spent sourcing / screening profiles"
    },
    problem: "Reduce it to",
    after: {
      value: {
        value_type: "number",
        target: 6,
        suffix: "%"
      }
    }
  },
  {
    before: {
      prefix: "Only",
      value: {
        value_type: "number",
        target: 15,
        suffix: "%"
      },
      label: "of advert responses are relevant"
    },
    problem: "Increase quality with",
    after: {
      value: {
        value_type: "number",
        target: 90,
        suffix: "%"
      },
      label: "accuracy"
    }
  },
  {
    before: {
      prefix: "On average, a Recruiter can screen",
      value: {
        value_type: "number",
        target: 90,
        suffix: ""
      },
      label: "profiles per day"
    },
    problem: "We unlock a new unit of measurement:",
    after: {
      value: {
        value_type: "text",
        text: "TBs",
        class_name: "stat-comparison"
      }
    }
  },
  {
    before: {
      prefix: "Talent Mapping / Sourcing, from 2",
      value: {
        value_type: "text",
        text: "weeks",
        class_name: "stat-comparison"
      }
    },
    after: {
      prefix: "To 2",
      value: {
        value_type: "text",
        text: "days",
        class_name: "stat-comparison"
      }
    }
  }
]);

const B2B_TESTIMONIAL_OL = Object.freeze([
  {
    heading: "Achieve Gender Parity, even in Deep-Tech and STEM",
    figure_aria_label: "Client testimonial from Cibby Pulikkaseril",
    quote_line_ol: [
      "As a deep-tech Founder, it is essential to hire the best and brightest women and men out of Australia's top universities.",
      "We used Likened to get an incredible pipeline of passionate, ambitious engineers ready to be part of the future of robotics."
    ],
    profile_image: {
      src: "../assets/images/profile-pic-cibby-pulikkaseril-img.jpg",
      alt: "Portrait of Cibby Pulikkaseril"
    },
    author_name: "Cibby Pulikkaseril",
    author_role: "Founder and CEO - Zabidou",
    company_logo: {
      src: "../assets/images/logo-2n3WnjSX.png",
      alt: "Zabidou logo"
    },
    profile_link: {
      href: "https://www.linkedin.com/in/cibbyp/",
      aria_label: "Open Cibby Pulikkaseril LinkedIn profile"
    }
  },
  {
    heading: "Exhaustively map out Talent for your Executive Search",
    figure_aria_label: "Client testimonial from Ben Cantrall",
    quote_line_ol: [
      "The capability that Likened has to identify extremely niche skillsets within tight parameters is clear.",
      "On a recent mapping exercise for an ASX-listed business, Likened was able to increase our identified candidate pool from 7 to 55. Likened also enabled us to find the skillsets hidden behind unexpected job titles."
    ],
    profile_image: {
      src: "../assets/images/profile-pic-ben-cantrall.jpg",
      alt: "Portrait of Ben Cantrall"
    },
    author_name: "Ben Cantrall",
    author_role: "Executive Search Director - Preacta",
    company_logo: {
      src: "../assets/images/logo-preacta_400x400.jpg",
      alt: "Preacta logo"
    },
    profile_link: {
      href: "https://www.linkedin.com/in/ben-cantrall-7217591a/",
      aria_label: "Open Ben Cantrall LinkedIn profile"
    }
  },
  {
    heading: "Leverage AI-driven Market Intelligence",
    figure_aria_label: "Client testimonial from Jacques Lépron",
    quote_line_ol: [
      "Expanding into a new market, we used Likened to build a scalable talent map for a BDM role across LinkedIn and a government data source, and to gather market intelligence on our competitors at the same time.",
      "The competitor analysis and analytics were clear, easy to visualise and immediately actionable.",
      "Highly recommended!"
    ],
    profile_image: {
      src: "../assets/images/profile-pic-jacques-lepron.jpg",
      alt: "Portrait of Jacques Lépron"
    },
    author_name: "Jacques Lépron",
    author_role: "Co-Founder - Délidoor",
    company_logo: {
      src: "../assets/images/logo-delidoor-logo-with-tagline-205x.svg",
      alt: "Délidoor logo"
    },
    profile_link: {
      href: "https://www.linkedin.com/in/jacqueslepron/",
      aria_label: "Open Jacques Lépron LinkedIn profile"
    }
  }
]);

function createStatLabelSpan(text_val) {
  const stat_label_span = document.createElement("span");
  stat_label_span.className = "stat-label";
  stat_label_span.textContent = text_val;
  return stat_label_span;
}

function createStatValueSpan(value_data) {
  if (value_data.value_type === "number") {
    const stat_counter_span = document.createElement("span");
    stat_counter_span.className = "stat-counter";
    stat_counter_span.dataset.target = `${value_data.target}`;
    stat_counter_span.dataset.suffix = `${value_data.suffix ?? ""}`;
    stat_counter_span.textContent = "0";
    return stat_counter_span;
  }

  const stat_text_span = document.createElement("span");
  stat_text_span.className = value_data.class_name ?? "stat-comparison";
  stat_text_span.textContent = value_data.text;
  return stat_text_span;
}

function buildStatSide(side_data) {
  const side_element = document.createElement(side_data.link ? "a" : "div");
  side_element.classList.add("stat-link");

  if (side_data.link) {
    side_element.classList.add("link-no-underline");
    side_element.href = side_data.link.href;
    side_element.target = "_blank";
    side_element.rel = "noopener noreferrer";
    side_element.dataset.source = side_data.link.source;
  }

  if (side_data.prefix) {
    side_element.appendChild(createStatLabelSpan(side_data.prefix));
  }

  if (side_data.value) {
    side_element.appendChild(createStatValueSpan(side_data.value));
  }

  if (side_data.label) {
    side_element.appendChild(createStatLabelSpan(side_data.label));
  }

  return side_element;
}

function renderStatsCards() {
  const stats_carousel = document.getElementById("b2b-stats-carousel");
  const stats_template = document.getElementById("b2b-stat-card-template");

  if (!(stats_carousel instanceof HTMLElement)) {
    return;
  }

  if (!(stats_template instanceof HTMLTemplateElement)) {
    return;
  }

  stats_carousel.replaceChildren();

  B2B_STATS_CARD_OL.forEach((stats_card_data) => {
    const stats_fragment = document.importNode(stats_template.content, true);
    const before_slot = stats_fragment.querySelector(
      '[data-role="before-slot"]'
    );
    const after_slot = stats_fragment.querySelector('[data-role="after-slot"]');
    const problem_slot = stats_fragment.querySelector('[data-role="problem"]');

    if (before_slot) {
      before_slot.replaceChildren(buildStatSide(stats_card_data.before));
    }

    if (after_slot) {
      after_slot.replaceChildren(buildStatSide(stats_card_data.after));
    }

    if (problem_slot) {
      if (stats_card_data.problem) {
        problem_slot.textContent = stats_card_data.problem;
        problem_slot.hidden = false;
      } else {
        problem_slot.hidden = true;
      }
    }

    stats_carousel.appendChild(stats_fragment);
  });
}

function renderTestimonials() {
  const testimonial_track = document.getElementById("b2b-testimonial-carousel");
  const testimonial_template = document.getElementById(
    "b2b-testimonial-card-template"
  );

  if (!(testimonial_track instanceof HTMLElement)) {
    return;
  }

  if (!(testimonial_template instanceof HTMLTemplateElement)) {
    return;
  }

  testimonial_track.replaceChildren();

  B2B_TESTIMONIAL_OL.forEach((testimonial_data, index) => {
    const testimonial_fragment = document.importNode(
      testimonial_template.content,
      true
    );
    const heading_elm = testimonial_fragment.querySelector(
      '[data-role="heading"]'
    );
    const figure_elm = testimonial_fragment.querySelector(
      '[data-role="figure"]'
    );
    const quote_lines_elm = testimonial_fragment.querySelector(
      '[data-role="quote-lines"]'
    );
    const profile_image_elm = testimonial_fragment.querySelector(
      '[data-role="profile-image"]'
    );
    const author_name_elm = testimonial_fragment.querySelector(
      '[data-role="author-name"]'
    );
    const author_role_elm = testimonial_fragment.querySelector(
      '[data-role="author-role"]'
    );
    const company_logo_elm = testimonial_fragment.querySelector(
      '[data-role="company-logo"]'
    );
    const profile_link_elm = testimonial_fragment.querySelector(
      '[data-role="profile-link"]'
    );

    if (heading_elm) {
      heading_elm.textContent = testimonial_data.heading;
      heading_elm.id =
        index === 0
          ? "testimonial-heading"
          : `testimonial-heading-${index + 1}`;
    }

    if (figure_elm) {
      figure_elm.setAttribute("aria-label", testimonial_data.figure_aria_label);
    }

    if (quote_lines_elm) {
      testimonial_data.quote_line_ol.forEach((quote_line) => {
        const paragraph = document.createElement("p");
        const emphasis = document.createElement("em");
        emphasis.textContent = quote_line;
        paragraph.appendChild(emphasis);
        quote_lines_elm.appendChild(paragraph);
      });
    }

    if (profile_image_elm instanceof HTMLImageElement) {
      profile_image_elm.src = testimonial_data.profile_image.src;
      profile_image_elm.alt = testimonial_data.profile_image.alt;
    }

    if (author_name_elm) {
      author_name_elm.textContent = testimonial_data.author_name;
    }

    if (author_role_elm) {
      author_role_elm.textContent = testimonial_data.author_role;
    }

    if (company_logo_elm instanceof HTMLImageElement) {
      company_logo_elm.src = testimonial_data.company_logo.src;
      company_logo_elm.alt = testimonial_data.company_logo.alt;
    }

    if (profile_link_elm instanceof HTMLAnchorElement) {
      profile_link_elm.href = testimonial_data.profile_link.href;
      profile_link_elm.setAttribute(
        "aria-label",
        testimonial_data.profile_link.aria_label
      );
    }

    testimonial_track.appendChild(testimonial_fragment);
  });
}

function initializeStatsCarousel() {
  const stats_viewport = document.getElementById("b2b-stats-carousel-viewport");
  const stats_track = document.getElementById("b2b-stats-carousel");
  const stats_prev_btn = document.getElementById("b2b-stats-prev");
  const stats_next_btn = document.getElementById("b2b-stats-next");
  const stats_page_indicator = document.getElementById(
    "b2b-stats-page-indicator"
  );

  if (
    !(stats_viewport instanceof HTMLElement) ||
    !(stats_track instanceof HTMLElement) ||
    !(stats_prev_btn instanceof HTMLButtonElement) ||
    !(stats_next_btn instanceof HTMLButtonElement) ||
    !(stats_page_indicator instanceof HTMLElement)
  ) {
    return;
  }

  const stats_card_ol = Array.from(stats_track.querySelectorAll(".stat-item"));
  const mobile_query = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
  const reduced_motion_query = window.matchMedia(REDUCED_MOTION_QUERY);
  const stats_section = stats_viewport.closest(".segmented-section");

  let current_index = 0;
  let auto_advance_enabled = true;

  const getVisibleCardCount = () => (mobile_query.matches ? 1 : 3);

  const getLastIndex = () =>
    Math.max(0, stats_card_ol.length - getVisibleCardCount());

  const getWrappedIndex = (new_index) => {
    const last_index = getLastIndex();
    if (last_index === 0) {
      return 0;
    }

    if (new_index < 0) {
      return last_index;
    }

    if (new_index > last_index) {
      return 0;
    }

    return new_index;
  };

  const stopAutoAdvance = () => {
    AnimationManager.actions.clearIntervalAction({
      parameter: { interval_name: STATS_CAROUSEL_INTERVAL_NAME }
    });
  };

  const renderCarousel = () => {
    const last_index = getLastIndex();
    current_index = Math.max(0, Math.min(current_index, last_index));

    const offset_left = stats_card_ol[current_index]?.offsetLeft ?? 0;
    stats_track.style.transform = `translateX(-${offset_left}px)`;

    const has_multiple_pages = last_index > 0;
    stats_prev_btn.disabled = !has_multiple_pages;
    stats_next_btn.disabled = !has_multiple_pages;
    stats_page_indicator.textContent = `${current_index + 1} / ${last_index + 1}`;
  };

  const navigateTo = (new_index) => {
    current_index = getWrappedIndex(new_index);
    renderCarousel();
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();

    const last_index = getLastIndex();
    if (
      !auto_advance_enabled ||
      last_index === 0 ||
      reduced_motion_query.matches
    ) {
      return;
    }

    AnimationManager.actions.createIntervalAction({
      parameter: {
        interval_name: STATS_CAROUSEL_INTERVAL_NAME,
        interval_ms: AUTO_ADVANCE_INTERVAL_MS,
        callback: () => {
          const max_index = getLastIndex();
          current_index = current_index >= max_index ? 0 : current_index + 1;
          renderCarousel();
        }
      }
    });
  };

  stats_prev_btn.addEventListener("click", () => {
    navigateTo(current_index - 1);
  });

  stats_next_btn.addEventListener("click", () => {
    navigateTo(current_index + 1);
  });

  const commitPageJump = () => {
    const typed_index = Number.parseInt(
      stats_page_indicator.textContent ?? "",
      10
    );
    const last_index = getLastIndex();

    if (Number.isNaN(typed_index)) {
      renderCarousel();
      return;
    }

    const one_based_index = Math.max(1, Math.min(typed_index, last_index + 1));
    navigateTo(one_based_index - 1);
  };

  stats_page_indicator.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitPageJump();
      stats_page_indicator.blur();
    }
  });

  stats_page_indicator.addEventListener("blur", commitPageJump);

  const resetForViewportChange = () => {
    current_index = 0;
    renderCarousel();
    startAutoAdvance();
  };

  mobile_query.addEventListener("change", resetForViewportChange);
  reduced_motion_query.addEventListener("change", resetForViewportChange);
  window.addEventListener("resize", renderCarousel);

  if (stats_section) {
    const stop_on_first_interaction = () => {
      auto_advance_enabled = false;
      stopAutoAdvance();
    };

    ["click", "keydown", "mousedown", "touchstart", "focusin"].forEach(
      (event_type) => {
        stats_section.addEventListener(event_type, stop_on_first_interaction, {
          once: true
        });
      }
    );

    AnimationManager.actions.stopOnFirstInteraction({
      target: stats_section,
      parameter: {
        interval_name: STATS_CAROUSEL_INTERVAL_NAME,
        event_types: ["click", "keydown", "mousedown", "touchstart", "focusin"]
      }
    });
  }

  renderCarousel();
  startAutoAdvance();
}

function initializeTestimonialCarousel() {
  const testimonial_viewport = document.getElementById(
    "b2b-testimonial-carousel-viewport"
  );
  const testimonial_track = document.getElementById("b2b-testimonial-carousel");
  const testimonial_prev_btn = document.getElementById("b2b-testimonial-prev");
  const testimonial_next_btn = document.getElementById("b2b-testimonial-next");
  const testimonial_page_indicator = document.getElementById(
    "b2b-testimonial-page-indicator"
  );

  if (
    !(testimonial_viewport instanceof HTMLElement) ||
    !(testimonial_track instanceof HTMLElement) ||
    !(testimonial_prev_btn instanceof HTMLButtonElement) ||
    !(testimonial_next_btn instanceof HTMLButtonElement) ||
    !(testimonial_page_indicator instanceof HTMLElement)
  ) {
    return;
  }

  const testimonial_slide_ol = Array.from(
    testimonial_track.querySelectorAll(".testimonial-slide")
  );
  const reduced_motion_query = window.matchMedia(REDUCED_MOTION_QUERY);
  const testimonial_section =
    testimonial_viewport.closest(".segmented-section");

  let current_index = 0;
  let auto_advance_enabled = true;

  const getLastIndex = () => Math.max(0, testimonial_slide_ol.length - 1);

  const getWrappedIndex = (new_index) => {
    const last_index = getLastIndex();
    if (last_index === 0) {
      return 0;
    }

    if (new_index < 0) {
      return last_index;
    }

    if (new_index > last_index) {
      return 0;
    }

    return new_index;
  };

  const stopAutoAdvance = () => {
    AnimationManager.actions.clearIntervalAction({
      parameter: { interval_name: TESTIMONIAL_CAROUSEL_INTERVAL_NAME }
    });
  };

  const renderCarousel = () => {
    const last_index = getLastIndex();
    current_index = Math.max(0, Math.min(current_index, last_index));

    const offset_left = testimonial_slide_ol[current_index]?.offsetLeft ?? 0;
    testimonial_track.style.transform = `translateX(-${offset_left}px)`;

    const has_multiple_pages = last_index > 0;
    testimonial_prev_btn.disabled = !has_multiple_pages;
    testimonial_next_btn.disabled = !has_multiple_pages;
    testimonial_page_indicator.textContent = `${current_index + 1} / ${last_index + 1}`;
  };

  const navigateTo = (new_index) => {
    current_index = getWrappedIndex(new_index);
    renderCarousel();
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();

    const last_index = getLastIndex();
    if (
      !auto_advance_enabled ||
      last_index === 0 ||
      reduced_motion_query.matches
    ) {
      return;
    }

    AnimationManager.actions.createIntervalAction({
      parameter: {
        interval_name: TESTIMONIAL_CAROUSEL_INTERVAL_NAME,
        interval_ms: AUTO_ADVANCE_INTERVAL_MS,
        callback: () => {
          const max_index = getLastIndex();
          current_index = current_index >= max_index ? 0 : current_index + 1;
          renderCarousel();
        }
      }
    });
  };

  testimonial_prev_btn.addEventListener("click", () => {
    navigateTo(current_index - 1);
  });

  testimonial_next_btn.addEventListener("click", () => {
    navigateTo(current_index + 1);
  });

  const commitPageJump = () => {
    const typed_index = Number.parseInt(
      testimonial_page_indicator.textContent ?? "",
      10
    );
    const last_index = getLastIndex();

    if (Number.isNaN(typed_index)) {
      renderCarousel();
      return;
    }

    const one_based_index = Math.max(1, Math.min(typed_index, last_index + 1));
    navigateTo(one_based_index - 1);
  };

  testimonial_page_indicator.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitPageJump();
      testimonial_page_indicator.blur();
    }
  });

  testimonial_page_indicator.addEventListener("blur", commitPageJump);

  const resetCarousel = () => {
    current_index = 0;
    renderCarousel();
    startAutoAdvance();
  };

  reduced_motion_query.addEventListener("change", resetCarousel);
  window.addEventListener("resize", renderCarousel);

  if (testimonial_section) {
    const stop_on_first_interaction = () => {
      auto_advance_enabled = false;
      stopAutoAdvance();
    };

    ["click", "keydown", "mousedown", "touchstart", "focusin"].forEach(
      (event_type) => {
        testimonial_section.addEventListener(
          event_type,
          stop_on_first_interaction,
          { once: true }
        );
      }
    );

    AnimationManager.actions.stopOnFirstInteraction({
      target: testimonial_section,
      parameter: {
        interval_name: TESTIMONIAL_CAROUSEL_INTERVAL_NAME,
        event_types: ["click", "keydown", "mousedown", "touchstart", "focusin"]
      }
    });
  }

  renderCarousel();
  startAutoAdvance();
}

function initializeB2BIcebergSwitch() {
  const iceberg_toggle = document.getElementById("iceberg-toggle");
  const iceberg_image = document.getElementById("iceberg-image");
  const iceberg_heading = document.getElementById("iceberg-toggle-heading");
  const pain_points_panel = document.getElementById("iceberg-pain-points");
  const value_adds_panel = document.getElementById("iceberg-value-adds");

  if (
    !(iceberg_toggle instanceof HTMLInputElement) ||
    !(iceberg_image instanceof HTMLImageElement) ||
    !(iceberg_heading instanceof HTMLElement) ||
    !(pain_points_panel instanceof HTMLElement) ||
    !(value_adds_panel instanceof HTMLElement)
  ) {
    return;
  }

  const OVERLAY_ID = "iceberg-svg-overlay";

  const syncIcebergState = () => {
    const sea_rect = document.getElementById("sea-surface-shape");
    const red_rect = document.getElementById("red-rectangle-shape");
    const green_rect = document.getElementById("green-rectangle-shape");

    if (iceberg_toggle.checked) {
      iceberg_heading.textContent = "Headhunt Passive-Search Talent";
      pain_points_panel.hidden = true;
      value_adds_panel.hidden = false;
      sea_rect?.classList.add("hidden");
      red_rect?.classList.add("hidden");
      green_rect?.classList.remove("hidden");
      return;
    }

    iceberg_heading.textContent = "Reactive Post & Pray approach";
    pain_points_panel.hidden = false;
    value_adds_panel.hidden = true;
    sea_rect?.classList.remove("hidden");
    red_rect?.classList.remove("hidden");
    green_rect?.classList.add("hidden");
  };

  const initialiseOverlay = () => {
    const ratio = iceberg_image.naturalHeight
      ? iceberg_image.offsetHeight / iceberg_image.naturalHeight
      : 0;

    if (!ratio) {
      requestAnimationFrame(initialiseOverlay);
      return;
    }

    if (!document.getElementById(OVERLAY_ID)) {
      buildSVGOverlayOn(iceberg_image, OVERLAY_ID);
    }

    const iceberg_overlay = document.getElementById(OVERLAY_ID);
    if (!(iceberg_overlay instanceof SVGSVGElement)) {
      return;
    }

    const BASE_IMAGE_HEIGHT = 419;
    const default_red_rect_height_ratio = 119 / BASE_IMAGE_HEIGHT;
    const default_sea_surface_y_ratio = 121 / BASE_IMAGE_HEIGHT;
    const default_green_rect_start_ratio = 205 / BASE_IMAGE_HEIGHT;
    const default_green_rect_end_ratio = 378 / BASE_IMAGE_HEIGHT;
    const source_image_height =
      iceberg_image.naturalHeight || BASE_IMAGE_HEIGHT;

    const red_rect_height_ratio = Number.parseFloat(
      iceberg_image.dataset.redRectHeightRatio ??
        `${default_red_rect_height_ratio}`
    );
    const sea_surface_y_ratio = Number.parseFloat(
      iceberg_image.dataset.seaSurfaceYRatio ?? `${default_sea_surface_y_ratio}`
    );
    const green_rect_start_ratio = Number.parseFloat(
      iceberg_image.dataset.greenRectStartRatio ??
        `${default_green_rect_start_ratio}`
    );
    const green_rect_end_ratio = Number.parseFloat(
      iceberg_image.dataset.greenRectEndRatio ??
        `${default_green_rect_end_ratio}`
    );

    const toRenderedSize = (rect, excludedDims = []) =>
      Object.fromEntries(
        Object.entries(rect).map(([dim, value]) => [
          dim,
          excludedDims.includes(dim) ? value : value * ratio
        ])
      );

    const shape_ol = [
      {
        id: "sea-surface-shape",
        type: "image",
        rect: {
          x: 0,
          y: source_image_height * sea_surface_y_ratio,
          width: iceberg_image.offsetWidth,
          height: iceberg_image.offsetHeight / ratio
        },
        doNotScale: ["width", "height"],
        href: "/assets/images/surface-of-the-sea.png",
        attributes: {
          preserveAspectRatio: "xMidYMid slice"
        }
      },
      {
        id: "red-rectangle-shape",
        type: "rectangle",
        rect: {
          x: 0,
          y: 0,
          width: iceberg_image.offsetWidth,
          height: source_image_height * red_rect_height_ratio
        },
        doNotScale: ["width"],
        classNames: ["svg-red-rectangle"]
      },
      {
        id: "green-rectangle-shape",
        type: "rectangle",
        rect: {
          x: 0,
          y: source_image_height * green_rect_start_ratio,
          width: iceberg_image.offsetWidth,
          height:
            source_image_height *
            (green_rect_end_ratio - green_rect_start_ratio)
        },
        doNotScale: ["width"],
        classNames: ["svg-green-rectangle"]
      }
    ];

    shape_ol.forEach((shape_data) => {
      const { id, rect, doNotScale, classNames, type, href, attributes } =
        shape_data;

      if (document.getElementById(id)) {
        return;
      }

      let shape_elm;

      if (type === "rectangle") {
        shape_elm = createSVGRectangle(
          iceberg_overlay,
          toRenderedSize(rect, doNotScale)
        );
        shape_elm.classList.add(...classNames);
      } else {
        shape_elm = createSVGImage(
          iceberg_overlay,
          toRenderedSize(rect, doNotScale),
          href
        );
      }

      shape_elm.setAttribute("id", id);
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) =>
          setAttribute(shape_elm, key, value)
        );
      }
      shape_elm.classList.add("hidden");
      iceberg_overlay.appendChild(shape_elm);
    });

    iceberg_toggle.dispatchEvent(new Event("change"));
  };

  iceberg_toggle.addEventListener("change", syncIcebergState);

  iceberg_image.addEventListener("click", () => {
    iceberg_toggle.checked = !iceberg_toggle.checked;
    iceberg_toggle.dispatchEvent(new Event("change"));
  });

  if (iceberg_image.complete) {
    initialiseOverlay();
  } else {
    iceberg_image.addEventListener("load", initialiseOverlay);
  }

  const hidden_candidate_market_section =
    iceberg_toggle.closest(".segmented-section");

  if (hidden_candidate_market_section) {
    AnimationManager.actions.createIntervalAction({
      parameter: {
        interval_name: ICEBERG_AUTO_TOGGLE_INTERVAL_NAME,
        interval_ms: 1000,
        callback: () => {
          iceberg_toggle.checked = !iceberg_toggle.checked;
          iceberg_toggle.dispatchEvent(new Event("change"));
        }
      }
    });

    AnimationManager.actions.stopOnFirstInteraction({
      target: hidden_candidate_market_section,
      parameter: {
        interval_name: ICEBERG_AUTO_TOGGLE_INTERVAL_NAME,
        event_types: ["click", "keydown", "mousedown", "touchstart"]
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderStatsCards();
  renderTestimonials();

  const stats_counter_observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStatCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document
    .querySelectorAll("[data-target]")
    .forEach((counter_elm) => stats_counter_observer.observe(counter_elm));

  initializeStatsCarousel();
  initializeTestimonialCarousel();
  initializeB2BIcebergSwitch();

  window.addEventListener("beforeunload", () => {
    AnimationManager.actions.clearIntervalAction({
      parameter: { interval_name: STATS_CAROUSEL_INTERVAL_NAME }
    });
    AnimationManager.actions.clearIntervalAction({
      parameter: { interval_name: TESTIMONIAL_CAROUSEL_INTERVAL_NAME }
    });
    AnimationManager.actions.clearIntervalAction({
      parameter: { interval_name: ICEBERG_AUTO_TOGGLE_INTERVAL_NAME }
    });
  });
});

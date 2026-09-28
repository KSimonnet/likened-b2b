import {
  toPascalCase,
  toTextFrom
} from "@ksimonnet/utils/core/manip-str/index.js";
import { createAndAppendTrTdAnchorTo } from "@ksimonnet/utils/web/manip-dom/modules/create-and-append-tr-td-anchor-to.js";
import { createAndAppendTrTdTo } from "@ksimonnet/utils/web/manip-dom/modules/create-and-append-tr-td-to.js";

/**
 * @description Updates a table body by appending rows for each key-value pair in the card object, using either a plain cell or an anchor cell depending on the value.
 * @param {string} propsContainer - An object containing the properties (key value pairs) to access
 * @param {HTMLTableSectionElement} element - The table body element to update
 */
export function updateCardContentTable(element, propsContainer) {
  element.innerHTML = "";

  Object.keys(propsContainer).forEach((key) => {
    const value = propsContainer[key];
    if (!value) return;
    const class_name = element.id.replace("-list", "");

    if (typeof value === "object" && value.href) {
      // object with anchor attributes
      createAndAppendTrTdAnchorTo(element, {
        class_name,
        term: toTextFrom(toPascalCase(key)),
        anchorConfig: value
      });
    } else if (/^https?:\/\//.test(value)) {
      // TODO: Handle legacy URL string format
      createAndAppendTrTdAnchorTo(element, {
        class_name,
        term: toTextFrom(toPascalCase(key)),
        url: value
      });
    } else {
      createAndAppendTrTdTo(element, {
        class_name,
        term: toTextFrom(toPascalCase(key)),
        description: value
      });
    }
  });
}

// ==UserScript==
// @name         GDL Hacks
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Otimização para o sistema GDL: Separa número/ano e preenche automaticamente.
// @author       Perito Danilo Costa
// @match        *://www.gdl.sesp.parana/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/dancosta/gdl-hacks-userscript/main/gdl-hacks.user.js
// @downloadURL  https://raw.githubusercontent.com/dancosta/gdl-hacks-userscript/main/gdl-hacks.user.js
// ==/UserScript==

(function () {
  "use strict";

  // Element IDs identified from the GDL system source
  const TARDGET_IDS = {
    NUMBER_INPUT_ID: "Content_Search_txtNumber",
    YEAR_SELECT_ID: "Content_Search_ddlYear",
  };


  /**
   * Splits a string like "12.345/2018" and populates the fields.
   * @param {string} rawValue
   */
  const processInputData = (rawValue) => {
    if (!rawValue.includes("/")) return;

    const [rawNumber, rawYear] = rawValue.split("/");
    // Remove any non-numeric charateres from number part (like dots)
    const cleanNumber = rawNumber.replace(/\D/g, "");
    const cleanYear = rawYear.trim();

    const numberInputField = document.getElementById(TARDGET_IDS.NUMBER_INPUT_ID);
    const yearSelectField = document.getElementById(TARDGET_IDS.YEAR_SELECT_ID);

    if (numberInputField){
      updateField(numberInputField, cleanNumber);
      console.log(`[GDL Hacks] Number set to: ${cleanNumber}`);
    }

    if (yearSelectField){
      updateField(yearSelectField, cleanYear);
      console.log(`[GDL Hacks] Year set to: ${cleanYear}`);
    }

    console.log(`[GDL Hacks] Number: ${cleanNumber} | Year: ${cleanYear}`);
  };

  /**
     * Updates field values and triggers native events so the UI reacts.
     */
    const updateField = (element, value) => {
        if (!element) return;
        element.value = value;
        // Trigger events so ASP.NET/Browser knows the data changed
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    };

  /**
   * Initializes the GDL Hacks script by setting up the number input field and event listeners.
   * 
   * Clones the target number input element to remove existing event listeners,
   * and adds a custom paste event listener that processes input data containing forward slashes.
   * 
   * @function init
   * @returns {void}
   * @throws {void} Logs a warning and returns early if the target number input element is not found.
   * 
   * @description
   * - Retrieves the original number input element by ID from TARDGET_IDS.NUMBER_INPUT_ID
   * - Clones the element to reset its event listeners
   * - Replaces the original element with the cloned version in the DOM
   * - Attaches a paste event listener that:
   *   - Retrieves clipboard data as text
   *   - Checks if the clipboard data contains a forward slash "/"
   *   - Prevents default paste behavior if "/" is found
   *   - Calls processInputData() to handle the clipboard content
   */
  const init = () => {
    console.log("[GDL Hacks] Initializing script...");
    const originalNumberInput = document.getElementById(TARDGET_IDS.NUMBER_INPUT_ID);
    if (!originalNumberInput) {
      console.warn(
        "[GDL Hacks] Number input field not found. Script will not work.",
      );
      return;
    }

    console.log("[GDL Hacks] Script replacing number input field...");
    console.log("[GDL Hacks] Script initializing listeners ...");

    // Clone the original input to remove existing event listeners and replace it in the DOM
    const clonedInput = originalNumberInput.cloneNode(true);
    // Replace the original input with the cloned version
    originalNumberInput.parentNode.replaceChild(clonedInput, originalNumberInput);

    // Paste event listener to handle clipboard data with format "number/year"
    clonedInput.addEventListener("paste", (event) => {
      const clipboardData = (event.clipboardData || window.clipboardData).getData("text");
      console.log('[GDL Hacks] Paste triggered. Clipboard data:', clipboardData);
      if (clipboardData.includes("/")) {
        event.preventDefault(); // Stop original paste to avoid mask interference
        processInputData(clipboardData);
      }
    });

    // Blur event listener to ensure proper formatting when the user finishes editing
    clonedInput.addEventListener("blur", (event) => {
      // Ensure the field is properly formatted on blur
      const value = event.target.value;
      console.log('[GDL Hacks] Blur triggered. Value:', event.target.value);
      if (value.includes("/")) {
        
        processInputData(value);
      }
    });
  };

  init();
})();

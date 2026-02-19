// ==UserScript==
// @name         GDL Hacks
// @namespace    http://tampermonkey.net/
// @version      1.1.1-beta
// @description  Hacks para o sistema GDLSepara número/ano e preenche automaticamente.
// @author       Perito Danilo Costa
// @match        *://www.gdl.sesp.parana/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/dancosta/gdl-hacks-userscript/main/gdl-hacks.user.js
// @downloadURL  https://raw.githubusercontent.com/dancosta/gdl-hacks-userscript/main/gdl-hacks.user.js
// ==/UserScript==

(function () {
  "use strict";

  // --- 1. UTILITY FUNCTIONS & CONFIG ---

  const SETTINGS = {
    DEBUG: true, // Toggle logs
  };

  const logger = {
    log: (msg,...args) => {
      SETTINGS.DEBUG && console.log(`[GDL Hacks] ${msg}`, ...args);
    },
    info: (msg,...args) => {
      SETTINGS.DEBUG && console.info(`[GDL Hacks] ${msg}`, ...args);
    },
    warn: (msg,...args) => {
      SETTINGS.DEBUG && console.warn(`[GDL Hacks] ${msg}`, ...args);
    }
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

  // --- 2. MODULE: SEARCH REP ---
  
  // Element IDs identified from the GDL system source
  const SEARCH_IDS = {
    NUMBER_INPUT_ID: "Content_Search_txtNumber",
    YEAR_SELECT_ID: "Content_Search_ddlYear",
  };


  /**
   * Splits a string like "12.345/2018" and populates Number and Year fields.
   * @param {string} rawValue
   */
  const processSearchInputData = (rawValue) => {
    if (!rawValue.includes("/")) return;

    const [rawNumber, rawYear] = rawValue.split("/");
    // Remove any non-numeric charateres from number part (like dots)
    const cleanNumber = rawNumber.replace(/\D/g, "");
    const cleanYear = rawYear.trim();
    logger.info(`Number: ${cleanNumber} | Year: ${cleanYear}`);

    const numberInputField = document.getElementById(SEARCH_IDS.NUMBER_INPUT_ID);
    const yearSelectField = document.getElementById(SEARCH_IDS.YEAR_SELECT_ID);

    if (numberInputField){
      updateField(numberInputField, cleanNumber);
      logger.info(`Number set to: ${cleanNumber}`);
    }

    if (yearSelectField){
      updateField(yearSelectField, cleanYear);
      logger.info(`Year set to: ${cleanYear}`);
    }

  };

  

  /**
   * Initializes the search page GDL Hacks script by setting up the number input field and event listeners.
   * 
   * Clones the target number input element to remove existing event listeners,
   * and adds a custom paste event listener that processes input data containing forward slashes.
   * 
   * @function initSearchPage
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
  const initSearchPage = () => {
    logger.info("Initializing Search Page Hack...");
    const originalNumberInput = document.getElementById(SEARCH_IDS.NUMBER_INPUT_ID);
    if (!originalNumberInput) {
      logger.warn(
        "Number input field not found. Script will not work.",
      );
      return;
    }


    logger.info("Script replacing number input field...");
    logger.info("Script initializing listeners ...");

    // Clone the original input to remove existing event listeners and replace it in the DOM
    const clonedInput = originalNumberInput.cloneNode(true);
    // Replace the original input with the cloned version
    originalNumberInput.parentNode.replaceChild(clonedInput, originalNumberInput);

    // Paste event listener to handle clipboard data with format "number/year"
    clonedInput.addEventListener("paste", (event) => {
      const clipboardData = (event.clipboardData || window.clipboardData).getData("text");
      logger.info('Paste triggered. Clipboard data:', clipboardData);
      if (clipboardData.includes("/")) {
        event.preventDefault(); // Stop original paste to avoid mask interference
        processSearchInputData(clipboardData);
      }
    });

    // Blur event listener to ensure proper formatting when the user finishes editing
    clonedInput.addEventListener("blur", (event) => {
      // Ensure the field is properly formatted on blur
      const value = event.target.value;
      logger.info('Blur triggered. Value:', event.target.value);
      if (value.includes("/")) {
        processSearchInputData(value);
      }
    });
  };

  // --- 3. Router---
  // Simple router to initialize hacks based on the current page path
  const route = (path) => {
    logger.info(`Inside router. Current path: ${path}`);
    if (path.includes("/SAC/GDL_IC_NET/DefaultSearch/Default.aspx")) {
      initSearchPage();
    }
  };

  // --- 4. INIT ---
  const currentPath = window.location.pathname;
  logger.info(`Current path: ${currentPath}`);
  route(currentPath);
})();

// ==UserScript==
// @name         GDL Hacks
// @namespace    http://tampermonkey.net/
// @version      1.2.0 - Stable
// @description  Hacks para auxiliar no uso do sistema GDL.
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

  // --- 3. MODULE: REP EDITION ---
  const REP_IDS = {
    REP_TYPE_SELECT_ID: "Content_RepMain_ddlNatureExam",
    LOCAL_EXAMINATION_SELECT_ID: "Content_RepMain_ddlOrganExam",
    EXAMINATION_ADDRESS_INPUT_ID: "Content_RepMain_txtAddressExamOthers",
    NUMBER_INPUT_ID: "Content_RepMain_txtAddressNumberOthers",
    CITY_SELECT_ID: "Content_RepMain_ddlOthersCity",
    CMPLEMENTARY_ADDRESS_INPUT_ID: "Content_RepMain_txtAddressComplementOthers",
    OBS_TEXTAREA_ID: "Content_RepMain_txtCommentsScienceOthers",
  };

  // store REP data to reuse after changeing REP Type. Ex: B604 -> B601, B602, B603
  let repBuffer = null;

  const saveREPDataToBuffer = () => {
    const getVal = (id) => document.getElementById(id)?.value || "";
    repBuffer = {
      
      [REP_IDS.LOCAL_EXAMINATION_SELECT_ID]: getVal(REP_IDS.LOCAL_EXAMINATION_SELECT_ID),
      [REP_IDS.EXAMINATION_ADDRESS_INPUT_ID]: getVal(REP_IDS.EXAMINATION_ADDRESS_INPUT_ID),
      [REP_IDS.NUMBER_INPUT_ID]: getVal(REP_IDS.NUMBER_INPUT_ID),
      [REP_IDS.CITY_SELECT_ID]: getVal(REP_IDS.CITY_SELECT_ID),
      [REP_IDS.CMPLEMENTARY_ADDRESS_INPUT_ID]: getVal(REP_IDS.CMPLEMENTARY_ADDRESS_INPUT_ID),   
    }
    logger.info("REP data saved to buffer:", repBuffer);
  };

  const loadREPDataFromBuffer = () => {
    if (!repBuffer) return;

    //Usinbg Object.entries to loop through buffer and update fields dynamically
    Object.entries(repBuffer).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value) updateField(element, value);
    });

    logger.info("REP data restored from buffer:");
  };    

  /**
   * Initializes the REP Page Hack by setting up an event listener for changes to the REP Type select element.
   * When a change is detected, it saves the current REP data to a buffer, then polls the DOM for changes to the Examination Address field.
   * If the field is cleared (indicating an AJAX update), it restores the data from the buffer.
   * The polling mechanism includes a safety timeout to prevent infinite loops if the expected DOM changes do not occur.  
   */
  const initREPPage = () => {
    logger.info("Initializing REP Page Hack with Event Delegation...");
    

    // We attach the listener to the 'document' so it survives any AJAX DOM replacements
    document.addEventListener("change", (event) => {
      // Filtramos logo no início para evitar logs desnecessários
      if (event.target && event.target.id === REP_IDS.REP_TYPE_SELECT_ID) {
        logger.info("Nature change detected! Backing up address data...");
        saveREPDataToBuffer(); 

        let attempts = 0;
        const checkFormUpdate = setInterval(() => {
          attempts++;
          const addrField = document.getElementById(REP_IDS.EXAMINATION_ADDRESS_INPUT_ID);
          
          // Se o campo de endereço ficou vazio, o AJAX do ASP.NET agiu
          if (addrField && addrField.value === "" && repBuffer) {
            loadREPDataFromBuffer();
            clearInterval(checkFormUpdate);
            logger.info(`Address restored successfully after ${attempts} checks.`);
          }
          
          // Safety kill-switch
          if (attempts > 40) {
             logger.warn("Polling timeout: DOM didn't clear as expected.");
             clearInterval(checkFormUpdate);
          }
        }, 250);
      }
    });
  };
  // --- 4. Router---
  const PATHS = {
    SEARCH_PAGE: "/SAC/GDL_IC_NET/DefaultSearch/Default.aspx",
    REP_PAGE: "/SAC/GDL_IC_NET/REP/Default.aspx",
  };
  // Simple router to initialize hacks based on the current page path
  const route = (path) => {
    logger.info(`Inside router. Current path: ${path}`);
    if (path.includes(PATHS.SEARCH_PAGE)) {
      initSearchPage();
    } else if (path.includes(PATHS.REP_PAGE)) {
      initREPPage();
    }
  };  

  // --- 5. INIT ---
  const currentPath = window.location.pathname;
  logger.info(`Current path: ${currentPath}`);
  route(currentPath);
})();

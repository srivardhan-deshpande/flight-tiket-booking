/* ==========================================================================
   SKYFLOW RESERVATION LOGIC & ANIMATION CONTROLLER
   ========================================================================== */

// --- Static Airport Database ---
const AIRPORTS = [
  { code: "JFK", city: "New York", country: "United States", name: "John F. Kennedy Intl" },
  { code: "LHR", city: "London", country: "United Kingdom", name: "Heathrow Airport" },
  { code: "HND", city: "Tokyo", country: "Japan", name: "Haneda Airport" },
  { code: "CDG", city: "Paris", country: "France", name: "Charles de Gaulle Airport" },
  { code: "DXB", city: "Dubai", country: "United Arab Emirates", name: "Dubai International" },
  { code: "SIN", city: "Singapore", country: "Singapore", name: "Changi Airport" },
  { code: "SYD", city: "Sydney", country: "Australia", name: "Kingsford Smith Airport" },
  { code: "BOM", city: "Mumbai", country: "India", name: "Chhatrapati Shivaji Intl" }
];

// --- App State ---
let state = {
  from: null,         // Selected departure airport object
  to: null,           // Selected destination airport object
  date: "",           // Travel date
  passengers: 1,      // Traveler count
  flights: [],        // Generated flights for current search
  filteredFlights: [],// Flights after sorting and airline filters
  selectedFlight: null,// Currently chosen flight object
  selectedClass: "",  // 'economy', 'business', or 'first'
  passengerDetails: {
    name: "",
    email: "",
    phone: "",
    passport: "",
    gender: "male"
  }
};

// --- DOM Elements ---
const elements = {
  // Search Step
  searchSection: document.getElementById("step-search"),
  searchForm: document.getElementById("search-form"),
  inputFrom: document.getElementById("input-from"),
  inputTo: document.getElementById("input-to"),
  listFrom: document.getElementById("list-from"),
  listTo: document.getElementById("list-to"),
  btnSwap: document.getElementById("btn-swap-locations"),
  inputDate: document.getElementById("input-date"),
  btnPassengerDec: document.getElementById("btn-passenger-dec"),
  btnPassengerInc: document.getElementById("btn-passenger-inc"),
  passengerCountText: document.getElementById("passenger-count"),
  trendingCards: document.querySelectorAll(".destination-card"),

  // Loading Overlay
  loadingOverlay: document.getElementById("loading-overlay"),
  loaderText: document.getElementById("loader-text"),

  // Results Step
  resultsSection: document.getElementById("step-results"),
  btnResultsBack: document.getElementById("btn-results-back"),
  btnEditSearch: document.getElementById("btn-edit-search"),
  summaryRoute: document.getElementById("summary-route"),
  summaryMeta: document.getElementById("summary-meta"),
  sortBy: document.getElementById("sort-by"),
  airlineFilters: document.querySelectorAll(".airline-filter"),
  stopsFilter: document.querySelector(".stops-filter"),
  flightsCountText: document.getElementById("flights-count-text"),
  flightsContainer: document.getElementById("flights-list-container"),

  // Floating Action Bar
  floatingBar: document.getElementById("floating-action-bar"),
  briefDetails: document.getElementById("brief-flight-details"),
  briefPrice: document.getElementById("brief-price-total"),
  btnProceedBooking: document.getElementById("btn-proceed-booking"),

  // Passenger Step
  passengerSection: document.getElementById("step-passenger"),
  btnPassengerBack: document.getElementById("btn-passenger-back"),
  bookingForm: document.getElementById("booking-form"),
  passengerName: document.getElementById("passenger-name"),
  passengerEmail: document.getElementById("passenger-email"),
  passengerPhone: document.getElementById("passenger-phone"),
  passengerPassport: document.getElementById("passenger-passport"),
  passengerGender: document.getElementById("passenger-gender"),
  termsAgree: document.getElementById("terms-agree"),

  // Summary Sidebar
  sumFromCode: document.getElementById("sum-from-code"),
  sumFromCity: document.getElementById("sum-from-city"),
  sumToCode: document.getElementById("sum-to-code"),
  sumToCity: document.getElementById("sum-to-city"),
  sumAirline: document.getElementById("sum-airline"),
  sumDatetime: document.getElementById("sum-datetime"),
  sumCabin: document.getElementById("sum-cabin"),
  sumPassengers: document.getElementById("sum-passengers"),
  sumPassengersQty: document.getElementById("sum-passengers-qty"),
  sumBasePrice: document.getElementById("sum-base-price"),
  sumTaxesPrice: document.getElementById("sum-taxes-price"),
  sumGrandTotal: document.getElementById("sum-grand-total"),

  // Confirmation Step
  confirmationSection: document.getElementById("step-confirmation"),
  confirmEmail: document.getElementById("confirm-email-placeholder"),
  ticketClass: document.getElementById("ticket-class-type"),
  ticketFromCode: document.getElementById("ticket-from-code"),
  ticketFromCity: document.getElementById("ticket-from-city"),
  ticketDuration: document.getElementById("ticket-duration"),
  ticketToCode: document.getElementById("ticket-to-code"),
  ticketToCity: document.getElementById("ticket-to-city"),
  ticketName: document.getElementById("ticket-name"),
  ticketFlightNumber: document.getElementById("ticket-flight-number"),
  ticketSeat: document.getElementById("ticket-seat"),
  ticketBoardingTime: document.getElementById("ticket-boarding-time"),
  ticketDate: document.getElementById("ticket-date"),
  ticketGate: document.getElementById("ticket-gate"),
  ticketPnr: document.getElementById("ticket-pnr"),
  btnPrintTicket: document.getElementById("btn-print-ticket"),
  btnRestartBooking: document.getElementById("btn-restart-booking"),
  logoBtn: document.getElementById("logo-btn"),
  navFlights: document.getElementById("nav-flights"),
  navDiscover: document.getElementById("nav-discover"),
  navStatus: document.getElementById("nav-status")
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initSearchDate();
  setupAutocomplete();
  setupPassengerCounter();
  setupEventListeners();
});

// Set default departure date to tomorrow
function initSearchDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  elements.inputDate.value = `${yyyy}-${mm}-${dd}`;
  elements.inputDate.min = `${yyyy}-${mm}-${dd}`;
}

// --- Navigation/Wizard Transitions ---
function navigateToStep(stepId) {
  // Hide all sections
  document.querySelectorAll(".step-section").forEach(section => {
    section.classList.remove("active");
  });

  // Show target section
  const target = document.getElementById(stepId);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle header nav active states
  if (stepId === "step-search") {
    elements.navFlights.classList.add("active");
  } else {
    elements.navFlights.classList.remove("active");
  }
}

function showLoading(text, duration, callback) {
  elements.loaderText.textContent = text;
  elements.loadingOverlay.classList.add("visible");
  
  setTimeout(() => {
    elements.loadingOverlay.classList.remove("visible");
    if (callback) callback();
  }, duration);
}

// --- Autocomplete Logic ---
let highlightedIndex = -1;

function setupAutocomplete() {
  // Input fields focus & inputs
  elements.inputFrom.addEventListener("input", (e) => handleAutocomplete(e.target, elements.listFrom));
  elements.inputTo.addEventListener("input", (e) => handleAutocomplete(e.target, elements.listTo));

  elements.inputFrom.addEventListener("focus", (e) => handleAutocomplete(e.target, elements.listFrom));
  elements.inputTo.addEventListener("focus", (e) => handleAutocomplete(e.target, elements.listTo));

  // Keyboard navigation listeners
  elements.inputFrom.addEventListener("keydown", (e) => handleAutocompleteKey(e, elements.inputFrom, elements.listFrom));
  elements.inputTo.addEventListener("keydown", (e) => handleAutocompleteKey(e, elements.inputTo, elements.listTo));

  // Close lists when clicking outside
  document.addEventListener("click", (e) => {
    if (!elements.inputFrom.contains(e.target) && !elements.listFrom.contains(e.target)) {
      closeAutocomplete(elements.listFrom);
    }
    if (!elements.inputTo.contains(e.target) && !elements.listTo.contains(e.target)) {
      closeAutocomplete(elements.listTo);
    }
  });
}

function handleAutocomplete(inputEl, listEl) {
  const value = inputEl.value.trim().toLowerCase();
  listEl.innerHTML = "";
  highlightedIndex = -1;

  const matches = AIRPORTS.filter(airport => 
    airport.city.toLowerCase().includes(value) || 
    airport.code.toLowerCase().includes(value) || 
    airport.name.toLowerCase().includes(value)
  );

  if (matches.length > 0) {
    listEl.style.display = "block";
    listEl.offsetHeight; // Force reflow for transitions
    listEl.classList.add("visible");

    matches.forEach((airport, index) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.setAttribute("data-index", index);
      item.innerHTML = `
        <span class="ac-title">${airport.city} (${airport.code})</span>
        <span class="ac-sub">${airport.name}, ${airport.country}</span>
      `;
      item.addEventListener("click", () => {
        selectAirport(inputEl, listEl, airport);
      });
      listEl.appendChild(item);
    });
  } else {
    closeAutocomplete(listEl);
  }
}

function selectAirport(inputEl, listEl, airport) {
  inputEl.value = `${airport.city} (${airport.code})`;
  closeAutocomplete(listEl);
  
  // Save to state
  if (inputEl === elements.inputFrom) {
    state.from = airport;
  } else {
    state.to = airport;
  }
}

function closeAutocomplete(listEl) {
  listEl.classList.remove("visible");
  setTimeout(() => {
    if (!listEl.classList.contains("visible")) {
      listEl.style.display = "none";
      listEl.innerHTML = "";
    }
  }, 200); // aligns with CSS transition duration
}

function handleAutocompleteKey(e, inputEl, listEl) {
  const items = listEl.querySelectorAll(".autocomplete-item");
  if (listEl.style.display === "none" || items.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlightedIndex++;
    if (highlightedIndex >= items.length) highlightedIndex = 0;
    updateHighlightedItem(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    highlightedIndex--;
    if (highlightedIndex < 0) highlightedIndex = items.length - 1;
    updateHighlightedItem(items);
  } else if (e.key === "Enter") {
    if (highlightedIndex >= 0 && highlightedIndex < items.length) {
      e.preventDefault();
      
      const value = inputEl.value.trim().toLowerCase();
      const matches = AIRPORTS.filter(airport => 
        airport.city.toLowerCase().includes(value) || 
        airport.code.toLowerCase().includes(value) || 
        airport.name.toLowerCase().includes(value)
      );
      
      const chosenAirport = matches[highlightedIndex];
      if (chosenAirport) {
        selectAirport(inputEl, listEl, chosenAirport);
      }
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeAutocomplete(listEl);
  }
}

function updateHighlightedItem(items) {
  items.forEach((item, index) => {
    if (index === highlightedIndex) {
      item.classList.add("highlighted");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("highlighted");
    }
  });
}

// --- Passenger Counter Logic ---
function setupPassengerCounter() {
  elements.btnPassengerInc.addEventListener("click", () => {
    if (state.passengers < 9) {
      state.passengers++;
      updatePassengerUI();
    }
  });

  elements.btnPassengerDec.addEventListener("click", () => {
    if (state.passengers > 1) {
      state.passengers--;
      updatePassengerUI();
    }
  });
}

function updatePassengerUI() {
  const label = state.passengers === 1 ? "Traveler" : "Travelers";
  elements.passengerCountText.textContent = `${state.passengers} ${label}`;
}

// --- Swap Locations Logic ---
function swapLocations() {
  const tempFromText = elements.inputFrom.value;
  elements.inputFrom.value = elements.inputTo.value;
  elements.inputTo.value = tempFromText;

  const tempFromObj = state.from;
  state.from = state.to;
  state.to = tempFromObj;
}

// --- Event Listeners and Submits ---
function setupEventListeners() {
  // Swap Locations button
  elements.btnSwap.addEventListener("click", swapLocations);

  // Logo buttons go back to home page
  elements.logoBtn.addEventListener("click", resetToSearch);
  elements.btnRestartBooking.addEventListener("click", resetToSearch);

  // Search Submit
  elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    processSearch();
  });

  // Trending flight cards click handler
  elements.trendingCards.forEach(card => {
    card.addEventListener("click", () => {
      const fromStr = card.getAttribute("data-from");
      const toStr = card.getAttribute("data-to");
      
      const fromAirport = AIRPORTS.find(a => `${a.city} (${a.code})` === fromStr);
      const toAirport = AIRPORTS.find(a => `${a.city} (${a.code})` === toStr);
      
      if (fromAirport && toAirport) {
        state.from = fromAirport;
        state.to = toAirport;
        elements.inputFrom.value = fromStr;
        elements.inputTo.value = toStr;
        processSearch();
      }
    });
  });

  // Results Back Button
  elements.btnResultsBack.addEventListener("click", () => {
    navigateToStep("step-search");
  });
  elements.btnEditSearch.addEventListener("click", () => {
    navigateToStep("step-search");
  });

  // Results Sorting & Filtering
  elements.sortBy.addEventListener("change", applySortAndFilters);
  elements.airlineFilters.forEach(chk => {
    chk.addEventListener("change", applySortAndFilters);
  });
  elements.stopsFilter.addEventListener("change", applySortAndFilters);

  // Proceed to Booking Form
  elements.btnProceedBooking.addEventListener("click", () => {
    if (state.selectedFlight && state.selectedClass) {
      setupPassengerFormStep();
    }
  });

  // Passenger Back Button
  elements.btnPassengerBack.addEventListener("click", () => {
    navigateToStep("step-results");
  });

  // Booking Form Submission
  elements.bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitBooking();
  });

  // Print button
  elements.btnPrintTicket.addEventListener("click", () => {
    window.print();
  });
}

// --- Process Search Action ---
function processSearch() {
  // Input validations
  if (!state.from) {
    // Attempt parsing from manual text inputs
    state.from = parseAirportFromText(elements.inputFrom.value);
  }
  if (!state.to) {
    state.to = parseAirportFromText(elements.inputTo.value);
  }

  if (!state.from || !state.to) {
    alert("Please select departure and destination airports from the list.");
    return;
  }

  if (state.from.code === state.to.code) {
    alert("Departure and destination cities cannot be the same.");
    return;
  }

  state.date = elements.inputDate.value;

  // Build Results & Mock Flights
  showLoading("Finding premium cabin spaces...", 1500, () => {
    generateMockFlights();
    updateResultsUI();
    navigateToStep("step-results");
  });
}

function parseAirportFromText(text) {
  const clean = text.trim().toLowerCase();
  return AIRPORTS.find(a => 
    clean.includes(a.code.toLowerCase()) || 
    clean.includes(a.city.toLowerCase())
  );
}

// --- Generate Mock Flights Database ---
function generateMockFlights() {
  const airlines = ["SkyFlow Elite", "Quantum Airways", "Horizon Express"];
  const flightNumbers = {
    "SkyFlow Elite": "SF",
    "Quantum Airways": "QA",
    "Horizon Express": "HX"
  };

  const flightsCount = 4 + Math.floor(Math.random() * 3); // 4 to 6 flights
  const generated = [];

  // Consistent flight durations based on location mapping or fallback
  const key = `${state.from.code}-${state.to.code}`;
  let routeDurationMinutes = 320; // 5 hours 20 mins default
  
  const flightDurations = {
    "JFK-LHR": 465, // 7h 45m
    "LHR-JFK": 495, // 8h 15m
    "CDG-HND": 850, // 14h 10m
    "HND-CDG": 890, // 14h 50m
    "SIN-SYD": 470, // 7h 50m
    "SYD-SIN": 485, // 8h 5m
    "JFK-CDG": 435, // 7h 15m
    "LHR-DXB": 410, // 6h 50m
    "BOM-LHR": 570, // 9h 30m
    "SIN-HND": 415  // 6h 55m
  };

  if (flightDurations[key]) {
    routeDurationMinutes = flightDurations[key];
  } else if (flightDurations[`${state.to.code}-${state.from.code}`]) {
    routeDurationMinutes = flightDurations[`${state.to.code}-${state.from.code}`];
  } else {
    // Random fallback duration based on distance
    routeDurationMinutes = 240 + Math.floor(Math.random() * 500); 
  }

  // Baseline price depending on distance
  const basePriceSeed = 200 + Math.floor((routeDurationMinutes / 60) * 85);

  for (let i = 0; i < flightsCount; i++) {
    const airline = airlines[i % airlines.length];
    const flightNumPrefix = flightNumbers[airline];
    const flightNo = `${flightNumPrefix}-${100 + Math.floor(Math.random() * 899)}`;
    
    // Spread departure hours nicely
    const depHour = 6 + (i * 3) + Math.floor(Math.random() * 2);
    const depMinute = Math.random() > 0.5 ? 30 : 0;
    
    const depDate = new Date(`${state.date}T${String(depHour).padStart(2, '0')}:${String(depMinute).padStart(2, '0')}:00`);
    const arrDate = new Date(depDate.getTime() + (routeDurationMinutes * 60 * 1000));
    
    // Stops probability: first flight is always direct, others might be 1 stop
    const stops = (i === 0) ? 0 : (Math.random() > 0.65 ? 1 : 0);
    const finalDurationMinutes = stops === 1 ? routeDurationMinutes + 95 : routeDurationMinutes;

    const baseFare = basePriceSeed - 40 + (i * 35) + Math.floor(Math.random() * 20);

    generated.push({
      id: `f-${i}`,
      airline: airline,
      flightNo: flightNo,
      depTime: depDate,
      arrTime: arrDate,
      duration: finalDurationMinutes,
      stops: stops,
      baseFare: baseFare,
      taxes: 45 + Math.floor(Math.random() * 15),
      classPrices: {
        economy: baseFare,
        business: Math.round(baseFare * 2.2),
        first: Math.round(baseFare * 4.5)
      }
    });
  }

  state.flights = generated;
  state.filteredFlights = [...generated];
  state.selectedFlight = null;
  state.selectedClass = "";
  elements.floatingBar.classList.remove("visible");
}

// --- Apply Sorting & Filtration ---
function applySortAndFilters() {
  const sortType = elements.sortBy.value;
  const activeAirlines = Array.from(elements.airlineFilters)
    .filter(chk => chk.checked)
    .map(chk => chk.value);
  
  const nonstopOnly = elements.stopsFilter.checked;

  // 1. Filter
  let list = state.flights.filter(flight => {
    const airlineMatch = activeAirlines.includes(flight.airline);
    const stopMatch = !nonstopOnly || flight.stops === 0;
    return airlineMatch && stopMatch;
  });

  // 2. Sort
  if (sortType === "price") {
    list.sort((a, b) => a.classPrices.economy - b.classPrices.economy);
  } else if (sortType === "duration") {
    list.sort((a, b) => a.duration - b.duration);
  } else if (sortType === "departure") {
    list.sort((a, b) => a.depTime.getTime() - b.depTime.getTime());
  }

  state.filteredFlights = list;
  renderFlightCards();
}

// --- Render Flights list UI ---
function updateResultsUI() {
  // Update header summary text
  elements.summaryRoute.textContent = `${state.from.city} (${state.from.code}) to ${state.to.city} (${state.to.code})`;
  
  const formattedDate = new Date(state.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const label = state.passengers === 1 ? "Traveler" : "Travelers";
  elements.summaryMeta.textContent = `${formattedDate} • ${state.passengers} ${label}`;

  applySortAndFilters();
}

function renderFlightCards() {
  elements.flightsCountText.textContent = `Showing ${state.filteredFlights.length} available flights`;
  elements.flightsContainer.innerHTML = "";

  if (state.filteredFlights.length === 0) {
    elements.flightsContainer.innerHTML = `
      <div class="no-flights-placeholder">
        <p>No flights match your filter selection. Try adjusting your sidebar filters.</p>
      </div>
    `;
    return;
  }

  state.filteredFlights.forEach(flight => {
    const durationHrs = Math.floor(flight.duration / 60);
    const durationMins = flight.duration % 60;
    
    const depTimeString = flight.depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const arrTimeString = flight.arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add date indicator if it arrives next day
    const arrivesNextDay = flight.arrTime.getDate() !== flight.depTime.getDate();
    const nextDayTag = arrivesNextDay ? `<span class="next-day-alert">+1d</span>` : "";

    const card = document.createElement("div");
    card.className = `flight-card ${state.selectedFlight?.id === flight.id ? 'selected-active' : ''}`;
    card.setAttribute("data-id", flight.id);

    // Left Column Info HTML
    const leftColHtml = `
      <div class="flight-info-left">
        <div class="airline-badge-wrap">
          <svg class="airline-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 20 2.5S18 3 16.5 4.5L13 8 4.8 6.2c-.5-.1-1.1.1-1.4.5L3 7.2c-.4.5-.4 1.2.1 1.5l7.9 4.7-3.2 3.2L5 16l-.8 1.2c-.3.4-.2 1 .2 1.3.3.3.9.4 1.3.2L7 18l.8-2.8 3.2-3.2 4.7 7.9c.3.5 1 .5 1.5.1l.5-.4c.4-.3.6-.9.5-1.4z"/>
          </svg>
          <span class="airline-name">${flight.airline}</span>
          <span class="flight-code-sm">${flight.flightNo}</span>
        </div>
        
        <div class="flight-timeline">
          <div class="time-node">
            <span class="time">${depTimeString}</span>
            <span class="city">${state.from.code}</span>
          </div>
          <div class="timeline-path">
            <span class="timeline-dur">${durationHrs}h ${durationMins}m</span>
            <div class="timeline-line">
              <svg class="timeline-plane" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 20 2.5S18 3 16.5 4.5L13 8 4.8 6.2c-.5-.1-1.1.1-1.4.5L3 7.2c-.4.5-.4 1.2.1 1.5l7.9 4.7-3.2 3.2L5 16l-.8 1.2c-.3.4-.2 1 .2 1.3.3.3.9.4 1.3.2L7 18l.8-2.8 3.2-3.2 4.7 7.9c.3.5 1 .5 1.5.1l.5-.4c.4-.3.6-.9.5-1.4z"/>
              </svg>
            </div>
            <span class="timeline-stops">${flight.stops === 0 ? 'Non-stop' : '1 stop'}</span>
          </div>
          <div class="time-node">
            <span class="time">${arrTimeString} ${nextDayTag}</span>
            <span class="city">${state.to.code}</span>
          </div>
        </div>
      </div>
    `;

    // Right Column Pricing HTML
    const econActive = (state.selectedFlight?.id === flight.id && state.selectedClass === "economy") ? "active" : "";
    const busActive = (state.selectedFlight?.id === flight.id && state.selectedClass === "business") ? "active" : "";
    const firstActive = (state.selectedFlight?.id === flight.id && state.selectedClass === "first") ? "active" : "";

    const rightColHtml = `
      <div class="flight-class-selectors">
        <div class="class-price-card ${econActive}" data-class="economy">
          <span class="class-name-tag">Economy</span>
          <span class="class-price-value">$${flight.classPrices.economy}</span>
        </div>
        <div class="class-price-card ${busActive}" data-class="business">
          <span class="class-name-tag">Business</span>
          <span class="class-price-value">$${flight.classPrices.business}</span>
        </div>
        <div class="class-price-card ${firstActive}" data-class="first">
          <span class="class-name-tag">First Class</span>
          <span class="class-price-value">$${flight.classPrices.first}</span>
        </div>
      </div>
    `;

    card.innerHTML = leftColHtml + rightColHtml;
    
    // Wire Class Selection Cards click
    card.querySelectorAll(".class-price-card").forEach(priceBtn => {
      priceBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Avoid parent flight-card trigger
        const chosenClass = priceBtn.getAttribute("data-class");
        selectFlightClass(flight, chosenClass);
      });
    });

    // Wire Card level click (Defaults to economy)
    card.addEventListener("click", () => {
      selectFlightClass(flight, "economy");
    });

    elements.flightsContainer.appendChild(card);
  });
}

function selectFlightClass(flight, cabinClass) {
  state.selectedFlight = flight;
  state.selectedClass = cabinClass;

  // Redraw lists to show selected highlighted state
  renderFlightCards();

  // Update Floating Action Bar
  const singlePrice = flight.classPrices[cabinClass];
  const totalPrice = singlePrice * state.passengers;
  const formattedClass = cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1);

  elements.briefDetails.textContent = `${flight.airline} • ${formattedClass} Class (x${state.passengers})`;
  elements.briefPrice.textContent = `Total: $${totalPrice.toLocaleString()}`;

  elements.floatingBar.classList.add("visible");
}

// --- Setup Step 3: Passenger Form & Summary Sidebar ---
function setupPassengerFormStep() {
  const flight = state.selectedFlight;
  const cabinClass = state.selectedClass;
  
  // Passenger Form Header back route
  elements.btnPassengerBack.style.display = "flex";

  // Sidebar Flight Codes
  elements.sumFromCode.textContent = state.from.code;
  elements.sumFromCity.textContent = state.from.city;
  elements.sumToCode.textContent = state.to.code;
  elements.sumToCity.textContent = state.to.city;

  // Flight Info details
  elements.sumAirline.textContent = flight.airline;
  
  const depTimeFormatted = flight.depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const depDateFormatted = flight.depTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  elements.sumDatetime.textContent = `${depDateFormatted} • ${depTimeFormatted}`;

  const formattedClass = cabinClass === "first" ? "First Class" : cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1) + " Class";
  elements.sumCabin.textContent = formattedClass;

  const travelerLabel = state.passengers === 1 ? "1 Traveler" : `${state.passengers} Travelers`;
  elements.sumPassengers.textContent = travelerLabel;
  elements.sumPassengersQty.textContent = state.passengers;

  // Calculations
  const singlePrice = flight.classPrices[cabinClass];
  const baseTotal = singlePrice * state.passengers;
  const taxesTotal = flight.taxes * state.passengers;
  const grandTotal = baseTotal + taxesTotal;

  elements.sumBasePrice.textContent = `$${baseTotal.toLocaleString()}`;
  elements.sumTaxesPrice.textContent = `$${taxesTotal.toLocaleString()}`;
  elements.sumGrandTotal.textContent = `$${grandTotal.toLocaleString()}`;

  navigateToStep("step-passenger");
}

// --- Submit Booking & Form validation ---
function submitBooking() {
  let isValid = true;

  // Name Validation
  const nameVal = elements.passengerName.value.trim();
  if (nameVal.length < 2) {
    setInputError(elements.passengerName, true);
    isValid = false;
  } else {
    setInputError(elements.passengerName, false);
  }

  // Email Validation
  const emailVal = elements.passengerEmail.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailVal)) {
    setInputError(elements.passengerEmail, true);
    isValid = false;
  } else {
    setInputError(elements.passengerEmail, false);
  }

  // Phone Validation
  const phoneVal = elements.passengerPhone.value.trim();
  if (phoneVal.length < 8) {
    setInputError(elements.passengerPhone, true);
    isValid = false;
  } else {
    setInputError(elements.passengerPhone, false);
  }

  // Terms selection
  if (!elements.termsAgree.checked) {
    alert("You must agree to the Terms of Carriage to proceed.");
    isValid = false;
  }

  if (!isValid) return;

  // Save details
  state.passengerDetails = {
    name: nameVal,
    email: emailVal,
    phone: phoneVal,
    passport: elements.passengerPassport.value.trim(),
    gender: elements.passengerGender.value
  };

  // Perform animated booking submission
  showLoading("Securing cabin space and booking ticket...", 2000, () => {
    generateBoardingPass();
    navigateToStep("step-confirmation");
  });
}

function setInputError(inputEl, isError) {
  const wrapper = inputEl.closest(".form-input-group");
  if (wrapper) {
    if (isError) {
      wrapper.classList.add("invalid");
    } else {
      wrapper.classList.remove("invalid");
    }
  }
}

// --- Generate Boarding Pass Confirmation details ---
function generateBoardingPass() {
  const flight = state.selectedFlight;
  const cabinClass = state.selectedClass;
  const passenger = state.passengerDetails;

  // PNR code generation
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Seat number generation based on cabin class
  let seat = "";
  const randomRow = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const letters = ["A", "B", "C", "D", "E", "F"];
  
  if (cabinClass === "first") {
    seat = `${randomRow(1, 4)}${letters[Math.floor(Math.random() * 2)]}`; // 1A to 4B
  } else if (cabinClass === "business") {
    seat = `${randomRow(6, 12)}${letters[Math.floor(Math.random() * 4)]}`; // 6A to 12D
  } else {
    seat = `${randomRow(15, 32)}${letters[Math.floor(Math.random() * 6)]}`; // 15A to 32F
  }

  // Boarding Time is departure - 45 mins
  const boardingTime = new Date(flight.depTime.getTime() - (45 * 60 * 1000));
  
  const depTimeFormatted = flight.depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const boardingTimeFormatted = boardingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const flightDateFormatted = flight.depTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const durationHrs = Math.floor(flight.duration / 60);
  const durationMins = flight.duration % 60;

  // Gate designation
  const gates = ["A12", "B04", "B22", "C15", "E08"];
  const gate = gates[Math.floor(Math.random() * gates.length)];

  // Update UI Elements
  elements.confirmEmail.textContent = passenger.email;
  elements.ticketClass.textContent = cabinClass === "first" ? "FIRST CLASS" : cabinClass.toUpperCase();
  
  // Route details
  elements.ticketFromCode.textContent = state.from.code;
  elements.ticketFromCity.textContent = state.from.city;
  elements.ticketDuration.textContent = `${durationHrs}h ${durationMins}m`;
  elements.ticketToCode.textContent = state.to.code;
  elements.ticketToCity.textContent = state.to.city;

  // Passenger Ticket details
  elements.ticketName.textContent = passenger.name;
  elements.ticketFlightNumber.textContent = flight.flightNo;
  elements.ticketSeat.textContent = seat;
  elements.ticketBoardingTime.textContent = boardingTimeFormatted;
  elements.ticketDate.textContent = flightDateFormatted;
  elements.ticketGate.textContent = gate;
  elements.ticketPnr.textContent = pnr;
}

// --- Reset to Search Step (Restart) ---
function resetToSearch() {
  elements.searchForm.reset();
  elements.bookingForm.reset();
  initSearchDate();
  
  state.from = null;
  state.to = null;
  state.passengers = 1;
  state.selectedFlight = null;
  state.selectedClass = "";
  
  updatePassengerUI();
  
  // Close lists
  closeAutocomplete(elements.listFrom);
  closeAutocomplete(elements.listTo);

  navigateToStep("step-search");
}

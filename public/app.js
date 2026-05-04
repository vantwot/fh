// API Base URL
const API_BASE = "http://localhost:3000/api";

// State
let countries = [];
let federations = [];
let countryOptions = [];
let selectedCountries = [];
let selectedFederations = [];
let adultsFilterSelected = false;
let kidsFilterSelected = false;
let countrySearch = "";
let federationSearch = "";
let currentChampionships = [];
let currentPage = 1;
let allEvents = [];
let assignAthleteId = null;
let selectedEventIds = new Set();
const ITEMS_PER_PAGE = 10;
const championshipMap = new Map();

// ====== TAB NAVIGATION ======
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    // Remove active class from all buttons and content
    document.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.remove("active")
    );
    document.querySelectorAll(".tab-content").forEach((c) =>
      c.classList.remove("active")
    );

    // Add active class to clicked button and corresponding content
    btn.classList.add("active");
    document.getElementById(tabName).classList.add("active");

    // Load content when tab is opened
    if (tabName === "championships") {
      loadCountries();
      loadFederations();
      searchChampionships();
    }
    if (tabName === "athletes") loadAthletes();
    if (tabName === "events") loadEvents();
  });
});

// ====== CHAMPIONSHIPS ======

// Load countries
async function loadCountries() {
  try {
    const response = await fetch(`${API_BASE}/championships/countries`);
    countries = await response.json();
    renderCountriesFilters();
  } catch (error) {
    console.error("Error loading countries:", error);
  }
}

// Load federations
async function loadFederations() {
  try {
    const response = await fetch(`${API_BASE}/calendars/federations`);
    federations = await response.json();
    renderFederationsFilters();
  } catch (error) {
    console.error("Error loading federations:", error);
  }
}

// Render countries filters
function renderCountriesFilters() {
  const button = document.getElementById("countriesDropdownButton");
  const list = document.getElementById("countriesList");
  if (!button || !list) return;

  button.textContent = selectedCountries.length
    ? `Países (${selectedCountries.length})`
    : "Países";

  const filtered = countries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  list.innerHTML = filtered.length
    ? filtered
        .map(
          (country) => `
        <label class="multi-list-item">
          <input type="checkbox" value="${country}" class="country-filter" ${selectedCountries.includes(country) ? "checked" : ""} />
          <span>${country}</span>
        </label>
      `
        )
        .join("")
    : '<div class="empty-state">No hay resultados</div>';

  document.querySelectorAll(".country-filter").forEach((input) => {
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedCountries = [...new Set([...selectedCountries, e.target.value])];
      } else {
        selectedCountries = selectedCountries.filter((c) => c !== e.target.value);
      }
      renderCountriesFilters();
      searchChampionships();
    });
  });
}

// Render federations filters
function renderFederationsFilters() {
  const button = document.getElementById("federationsDropdownButton");
  const list = document.getElementById("federationsList");
  if (!button || !list) return;

  button.textContent = selectedFederations.length
    ? `Federaciones (${selectedFederations.length})`
    : "Federaciones";

  const filtered = federations.filter((federation) =>
    federation.toLowerCase().includes(federationSearch.toLowerCase())
  );

  list.innerHTML = filtered.length
    ? filtered
        .map(
          (federation) => `
        <label class="multi-list-item">
          <input type="checkbox" value="${federation}" class="federation-filter" ${selectedFederations.includes(federation) ? "checked" : ""} />
          <span>${federation}</span>
        </label>
      `
        )
        .join("")
    : '<div class="empty-state">No hay resultados</div>';

  document.querySelectorAll(".federation-filter").forEach((input) => {
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedFederations = [...new Set([...selectedFederations, e.target.value])];
      } else {
        selectedFederations = selectedFederations.filter((f) => f !== e.target.value);
      }
      renderFederationsFilters();
      searchChampionships();
    });
  });
}

async function loadCountryOptions() {
  try {
    const response = await fetch(`${API_BASE}/countries`);
    countryOptions = await response.json();
    renderCountryOptions();
  } catch (error) {
    console.error("Error loading country options:", error);
  }
}

function renderCountryOptions() {
  const athleteSelect = document.getElementById("athleteCountryId");
  const eventSelect = document.getElementById("eventCountryId");
  const options = `
    <option value="">Selecciona un país</option>
    ${countryOptions
      .map((country) => `<option value="${country.id}">${country.name}</option>`)
      .join("")}
  `;

  if (athleteSelect) {
    athleteSelect.innerHTML = options;
  }

  if (eventSelect) {
    eventSelect.innerHTML = options;
  }
}

async function loadAllEvents() {
  try {
    const response = await fetch(`${API_BASE}/events`);
    allEvents = await response.json();
  } catch (error) {
    console.error("Error loading all events:", error);
    allEvents = [];
  }
}

function renderAssignEventsModal(assignedEventIds = []) {
  const list = document.getElementById("assignEventsList");
  if (!list) return;

  if (!allEvents.length) {
    list.innerHTML = '<div class="loading">No hay eventos disponibles</div>';
    return;
  }

  selectedEventIds = new Set(assignedEventIds);

  list.innerHTML = allEvents
    .map(
      (event) => {
        const checked = selectedEventIds.has(event.id) ? "checked" : "";
        return `
          <label class="checkbox-item">
            <input
              type="checkbox"
              value="${event.id}"
              ${checked}
              class="assign-event-checkbox"
            />
            <span>${event.name} - ${event.city || "Sin ciudad"} (${formatDate(event.date)})</span>
          </label>
        `;
      }
    )
    .join("");

  document.querySelectorAll(".assign-event-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const eventId = Number(e.target.value);
      if (e.target.checked) {
        selectedEventIds.add(eventId);
      } else {
        selectedEventIds.delete(eventId);
      }
    });
  });
}

async function openAssignEventsModal(athleteId, athleteName, currentEvents = []) {
  assignAthleteId = athleteId;
  const assignModal = document.getElementById("assignEventsModal");
  if (!assignModal) return;

  if (!allEvents.length) {
    await loadAllEvents();
  }

  renderAssignEventsModal(currentEvents.map((ae) => ae.event.id));
  assignModal.classList.add("show");
}

async function saveAssignedEvents() {
  if (!assignAthleteId) return;

  const button = document.getElementById("saveAssignedEventsBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Guardando...";
  }

  try {
    const response = await fetch(`${API_BASE}/athletes/${assignAthleteId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventIds: Array.from(selectedEventIds) }),
    });

    const data = await response.json();
    if (response.ok) {
      showNotification("✅ Eventos asignados correctamente", "success");
      document.getElementById("assignEventsModal").classList.remove("show");
      loadAthletes();
    } else {
      console.error(data);
      showNotification(`❌ Error: ${data.error || "No se pudo asignar"}`, "error");
      if (button) {
        button.disabled = false;
        button.textContent = "Guardar asignación";
      }
    }
  } catch (error) {
    console.error("Error assigning events:", error);
    showNotification("❌ Error al asignar eventos", "error");
    if (button) {
      button.disabled = false;
      button.textContent = "Guardar asignación";
    }
  }
}

// Helper functions for dropdowns
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach((dropdown) => {
    dropdown.classList.remove("show");
  });
  document.querySelectorAll(".dropbtn").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function toggleDropdown(type) {
  const dropdown = document.getElementById(`${type}-dropdown`);
  const button = document.getElementById(`${type}DropdownButton`);
  if (!dropdown || !button) return;

  const isOpen = dropdown.classList.contains("show");
  closeAllDropdowns();

  if (!isOpen) {
    dropdown.classList.add("show");
    button.setAttribute("aria-expanded", "true");
  }
}

function initDropdownListeners() {
  const countryButton = document.getElementById("countriesDropdownButton");
  const federationButton = document.getElementById("federationsDropdownButton");
  const countriesSearch = document.getElementById("country-search");
  const federationsSearch = document.getElementById("federation-search");
  const countriesDropdown = document.getElementById("countries-dropdown");
  const federationsDropdown = document.getElementById("federations-dropdown");

  if (countryButton) {
    countryButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown("countries");
    });
  }

  if (federationButton) {
    federationButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown("federations");
    });
  }

  if (countriesDropdown) {
    countriesDropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  if (federationsDropdown) {
    federationsDropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  if (countriesSearch) {
    countriesSearch.addEventListener("input", (e) => {
      countrySearch = e.target.value;
      renderCountriesFilters();
    });
  }

  if (federationsSearch) {
    federationsSearch.addEventListener("input", (e) => {
      federationSearch = e.target.value;
      renderFederationsFilters();
    });
  }

  document.addEventListener("click", () => closeAllDropdowns());
}

// Handle category filters
document.addEventListener("DOMContentLoaded", () => {
  const adultsCheckbox = document.getElementById("adultsFilter");
  const kidsCheckbox = document.getElementById("kidsFilter");

  if (adultsCheckbox) {
    adultsCheckbox.addEventListener("change", (e) => {
      adultsFilterSelected = e.target.checked;
      searchChampionships();
    });
  }

  if (kidsCheckbox) {
    kidsCheckbox.addEventListener("change", (e) => {
      kidsFilterSelected = e.target.checked;
      searchChampionships();
    });
  }

  initDropdownListeners();
  loadCountryOptions();

  const championshipsGrid = document.getElementById("championshipsGrid");
  if (championshipsGrid) {
    championshipsGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".save-event-btn");
      if (!button) return;
      const champId = button.dataset.champId;
      if (!champId) return;
      saveChampionshipToDb(champId, button);
    });
  }

  const athletesGrid = document.getElementById("athletesGrid");
  if (athletesGrid) {
    athletesGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".assign-event-btn");
      if (!button) return;
      const athleteId = Number(button.dataset.athleteId);
      const athleteEvents = JSON.parse(button.dataset.athleteEvents || "[]");
      openAssignEventsModal(athleteId, button.dataset.athleteName, athleteEvents);
    });
  }

  const saveAssignedEventsBtn = document.getElementById("saveAssignedEventsBtn");
  if (saveAssignedEventsBtn) {
    saveAssignedEventsBtn.addEventListener("click", saveAssignedEvents);
  }

  const paginationControls = document.getElementById("paginationControls");
  if (paginationControls) {
    paginationControls.addEventListener("click", handlePaginationClick);
  }
});

// Search championships
async function searchChampionships() {
  const grid = document.getElementById("championshipsGrid");
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Buscando campeonatos...</div>';

  try {
    const response = await fetch(`${API_BASE}/championships/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        countries: selectedCountries,
        federations: selectedFederations,
        adultsFilterSelected,
        kidsFilterSelected,
      }),
    });

    const data = await response.json();

    // Extraer todos los campeonatos del array de meses
    const allChampionships = [];
    if (Array.isArray(data)) {
      data.forEach((monthData) => {
        if (monthData.championships && Array.isArray(monthData.championships)) {
          allChampionships.push(...monthData.championships);
        }
      });
    }

    if (allChampionships.length === 0) {
      currentChampionships = [];
      renderChampionships();
      return;
    }

    currentChampionships = allChampionships;
    currentPage = 1;
    renderChampionships();
  } catch (error) {
    console.error("Error searching championships:", error);
    grid.innerHTML =
      '<div class="loading">Error al buscar campeonatos</div>';
  }
}

function renderChampionships() {
  const grid = document.getElementById("championshipsGrid");
  const pagination = document.getElementById("paginationControls");
  if (!grid || !pagination) return;

  if (currentChampionships.length === 0) {
    grid.innerHTML =
      '<div class="loading">No se encontraron campeonatos que coincidan con los filtros</div>';
    pagination.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(currentChampionships.length / ITEMS_PER_PAGE));
  currentPage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = currentChampionships.slice(start, start + ITEMS_PER_PAGE);

  championshipMap.clear();
  pageItems.forEach((champ) => {
    const key = champ.id != null ? String(champ.id) : `${champ.name}:${champ.startDate}`;
    championshipMap.set(key, champ);
  });

  grid.innerHTML = pageItems
    .map(
      (champ) => {
        const key = champ.id != null ? String(champ.id) : `${champ.name}:${champ.startDate}`;
        return `
      <div class="championship-card">
        <h3>${champ.name || "Sin nombre"}</h3>
        <p><strong>📅 Fecha:</strong> ${formatDate(champ.startDate)}</p>
        <p><strong>📍 País:</strong> ${champ.country || "N/A"}</p>
        <p><strong>🏆 Federación:</strong> ${champ.calendar?.federation || "N/A"}</p>
        ${champ.city ? `<p><strong>🌆 Ciudad:</strong> ${champ.city}</p>` : ""}
        ${champ.arenaAddress ? `<p><strong>📍 Dirección:</strong> ${champ.arenaAddress}</p>` : ""}
        ${champ.eventUrl ? `<p><a href="${champ.eventUrl}" target="_blank">Ver más →</a></p>` : ""}
        <button class="btn btn-secondary save-event-btn" data-champ-id="${key}">Guardar en la BD</button>
      </div>
    `;
      }
    )
    .join("");

  pagination.innerHTML = renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return "";

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (currentPage > 1) {
    pages.push(
      `<button class="pagination-btn" data-page="${currentPage - 1}">Anterior</button>`
    );
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(
      `<button class="pagination-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`
    );
  }

  if (currentPage < totalPages) {
    pages.push(
      `<button class="pagination-btn" data-page="${currentPage + 1}">Siguiente</button>`
    );
  }

  return `<div class="pagination-row">${pages.join("")}</div>`;
}

function handlePaginationClick(event) {
  const target = event.target;
  if (!target.classList.contains("pagination-btn")) return;
  const page = Number(target.dataset.page);
  if (!page || page === currentPage) return;
  currentPage = page;
  renderChampionships();
}

async function saveChampionshipToDb(champId, button) {
  const championship = championshipMap.get(champId);
  if (!championship) {
    showNotification("❌ No se encontró el campeonato", "error");
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Guardando...";

  try {
    const response = await fetch(`${API_BASE}/events/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(championship),
    });

    const data = await response.json();
    if (response.ok) {
      button.textContent = "Guardado";
      button.classList.add("saved");
      showNotification("✅ Evento guardado en la BD", "success");
    } else {
      button.disabled = false;
      button.textContent = originalText;
      console.error(data);
      showNotification(`❌ Error: ${data.error || "No se pudo guardar"}`, "error");
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    console.error("Error guardando evento:", error);
    showNotification("❌ Error al guardar evento", "error");
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
  } catch {
    return dateString;
  }
}

// ====== ATHLETES ======

const athleteModal = document.getElementById("athleteModal");
const athleteForm = document.getElementById("athleteForm");
const addAthleteBtn = document.getElementById("addAthleteBtn");
const eventModal = document.getElementById("eventModal");
const addEventBtn = document.getElementById("addEventBtn");

if (addAthleteBtn) {
  addAthleteBtn.addEventListener("click", async () => {
    athleteForm.reset();
    await loadCountryOptions();
    athleteModal.classList.add("show");
  });
}

if (addEventBtn) {
  addEventBtn.addEventListener("click", () => {
    if (eventModal) {
      eventModal.classList.add("show");
    }
  });
}

document.querySelectorAll(".close").forEach((closeBtn) => {
  closeBtn.addEventListener("click", (e) => {
    e.target.closest(".modal").classList.remove("show");
  });
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("show");
  }
});

if (athleteForm) {
  athleteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const athlete = {
      name: document.getElementById("athleteName").value,
      discipline: document.getElementById("athleteDiscipline").value,
      countryId: parseInt(document.getElementById("athleteCountryId").value),
    };

    try {
      const response = await fetch(`${API_BASE}/athletes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(athlete),
      });

      if (response.ok) {
        athleteModal.classList.remove("show");
        loadAthletes();
        showNotification("✅ Atleta creado exitosamente!", "success");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("❌ Error al crear atleta", "error");
    }
  });
}

async function loadAthletes() {
  const grid = document.getElementById("athletesGrid");
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Cargando atletas...</div>';

  try {
    const response = await fetch(`${API_BASE}/athletes`);
    const athletes = await response.json();

    if (athletes.length === 0) {
      grid.innerHTML =
        '<div class="loading">No hay atletas registrados</div>';
      return;
    }

    grid.innerHTML = athletes
      .map((athlete) => {
        const assigned = athlete.events?.map((ae) => ae.event?.name).filter(Boolean) || [];
        return `
      <div class="athlete-card">
        <h3>${athlete.name}</h3>
        <p><strong>🏋️ Disciplina:</strong> ${athlete.discipline}</p>
        <p><strong>📍 País:</strong> ${athlete.country?.name || "N/A"}</p>
        <p><strong>Eventos asignados:</strong> ${assigned.length ? assigned.join(", ") : "Ninguno"}</p>
        <button class="btn btn-secondary assign-event-btn" data-athlete-id="${athlete.id}" data-athlete-name="${athlete.name}" data-athlete-events='${JSON.stringify(athlete.events || []).replace(/'/g, "&#39;")}'>Asignar evento</button>
      </div>
    `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading athletes:", error);
    grid.innerHTML = '<div class="loading">Error al cargar atletas</div>';
  }
}

async function loadEvents() {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Cargando eventos...</div>';

  try {
    const response = await fetch(`${API_BASE}/events`);
    const events = await response.json();

    if (events.length === 0) {
      grid.innerHTML = '<div class="loading">No hay eventos registrados</div>';
      return;
    }

    renderEvents(events);
  } catch (error) {
    console.error("Error loading events:", error);
    grid.innerHTML = '<div class="loading">Error al cargar eventos</div>';
  }
}

function renderEvents(events) {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  grid.innerHTML = events
    .map(
      (event) => `
      <div class="event-card">
        <h3>${event.name}</h3>
        <p><strong>📅 Fecha:</strong> ${formatDate(event.date)}</p>
        <p><strong>🏅 Deporte:</strong> ${event.sport || "N/A"}</p>
        <p><strong>📍 País:</strong> ${event.country?.name || "N/A"}</p>
      </div>
    `
    )
    .join("");
}

// ====== NOTIFICATIONS ======

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#27ae60" : "#e74c3c"};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 2000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add slide animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Load championships on page load
document.addEventListener("DOMContentLoaded", () => {
  loadCountries();
  loadFederations();
  searchChampionships();
});

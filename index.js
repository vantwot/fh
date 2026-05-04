require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// API Base URLs
const BJJ_API_BASE = "https://www.bjj-championships.com/api";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== BJJ CHAMPIONSHIPS API ENDPOINTS ======

// Obtener listado de países
app.get("/api/championships/countries", async (req, res) => {
  try {
    const response = await fetch(`${BJJ_API_BASE}/championships/countries`);
    const countries = await response.json();
    res.json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener países desde la base local
app.get("/api/countries", async (req, res) => {
  try {
    const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
    res.json(countries);
  } catch (error) {
    console.error("Error loading countries from DB:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener listado de federaciones
app.get("/api/calendars/federations", async (req, res) => {
  try {
    const response = await fetch(`${BJJ_API_BASE}/calendars/federations`);
    const federations = await response.json();
    res.json(federations);
  } catch (error) {
    console.error("Error fetching federations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar campeonatos
app.post("/api/championships/search", async (req, res) => {
  try {
    const { countries = [], federations = [], adultsFilterSelected = false, kidsFilterSelected = false } = req.body;
    
    const payload = {
      countries,
      federations,
      adultsFilterSelected,
      kidsFilterSelected,
    };

    const response = await fetch(`${BJJ_API_BASE}/championships/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const championships = await response.json();
    res.json(championships);
  } catch (error) {
    console.error("Error searching championships:", error);
    res.status(500).json({ error: error.message });
  }
});

// ====== EVENTOS ======

async function findOrCreateCountry(name) {
  const normalized = name?.trim();
  if (!normalized) {
    throw new Error("Country name is required");
  }

  let country = await prisma.country.findFirst({
    where: { name: { equals: normalized, mode: "insensitive" } },
  });

  if (!country) {
    country = await prisma.country.create({
      data: {
        name: normalized,
        continent: resolveContinent(normalized),
      },
    });
  }

  return country;
}

async function findOrCreatePromoter(name) {
  const normalized = name?.trim();
  if (!normalized) {
    throw new Error("Promoter name is required");
  }

  let promoter = await prisma.promoter.findFirst({
    where: { name: { equals: normalized, mode: "insensitive" } },
  });

  if (!promoter) {
    promoter = await prisma.promoter.create({
      data: { name: normalized },
    });
  }

  return promoter;
}

function resolveContinent(countryName) {
  const name = countryName.trim().toLowerCase();
  const northAmerica = ["usa", "us", "united states", "united states of america", "canada", "mexico"];
  const southAmerica = ["brazil", "argentina", "colombia", "peru", "chile", "venezuela", "ecuador", "bolivia", "paraguay", "uruguay"];
  const europe = ["spain", "france", "germany", "italy", "united kingdom", "uk", "netherlands", "belgium", "czech republic", "poland", "ireland", "portugal", "austria", "switzerland", "greece", "croatia", "slovakia", "denmark", "sweden", "norway", "finland", "hungary", "romania", "bulgaria", "serbia", "slovenia", "estonia", "latvia", "lithuania"];
  const asia = ["japan", "china", "south korea", "korea", "india", "thailand", "vietnam", "indonesia", "malaysia", "singapore", "uae", "qatar", "iran", "iraq", "israel", "turkey", "armenia", "georgia", "kazakhstan", "uzbekistan", "kyrgyzstan", "pakistan", "bangladesh", "philippines", "nepal", "sri lanka", "bangladesh"];
  const africa = ["angola", "south africa", "nigeria", "egypt", "morocco", "algeria", "tunis", "kenya", "ghana", "ethiopia", "senegal", "zimbabwe", "tanzania", "uganda", "cameroon", "algeria", "tunisia"];
  const oceania = ["australia", "new zealand", "fiji", "papua new guinea"];

  if (northAmerica.includes(name)) return "North America";
  if (southAmerica.includes(name)) return "South America";
  if (europe.includes(name)) return "Europe";
  if (asia.includes(name)) return "Asia";
  if (africa.includes(name)) return "Africa";
  if (oceania.includes(name)) return "Oceania";

  return "Unknown";
}

// Obtener eventos
app.get("/api/events", async (req, res) => {
  const events = await prisma.event.findMany({
    include: { country: true, promoter: true },
  });
  res.json(events);
});

// Crear evento
app.post("/api/events", async (req, res) => {
  const { name, date, sport, countryId, promoterId } = req.body;

  const event = await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      sport,
      countryId,
      promoterId,
    },
  });

  res.json(event);
});

app.post("/api/events/import", async (req, res) => {
  try {
    const championship = req.body;
    if (
      !championship?.name ||
      !championship?.startDate ||
      !championship?.country ||
      !championship?.calendar?.federation
    ) {
      return res.status(400).json({ error: "Datos de campeonato incompletos" });
    }

    const eventDate = new Date(championship.startDate);
    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: "Fecha de inicio inválida" });
    }

    const country = await findOrCreateCountry(championship.country);
    const promoter = await findOrCreatePromoter(championship.calendar.federation);

    const event = await prisma.event.create({
      data: {
        name: championship.name,
        date: eventDate,
        sport: championship.calendar.federation || "BJJ",
        countryId: country.id,
        promoterId: promoter.id,
      },
    });

    res.json(event);
  } catch (error) {
    console.error("Error importing championship to event:", error);
    res.status(500).json({ error: error.message });
  }
});

// ====== ATLETAS ======

app.get("/api/athletes", async (req, res) => {
  const athletes = await prisma.athlete.findMany({
    include: {
      packages: true,
      country: true,
      events: {
        include: {
          event: true,
        },
      },
    },
  });
  res.json(athletes);
});

app.post("/api/athletes", async (req, res) => {
  const { name, discipline, countryId } = req.body;

  const athlete = await prisma.athlete.create({
    data: {
      name,
      discipline,
      countryId: Number(countryId),
    },
  });

  res.json(athlete);
});

app.post("/api/athletes/:id/events", async (req, res) => {
  try {
    const athleteId = Number(req.params.id);
    const { eventIds } = req.body;
    if (!Array.isArray(eventIds)) {
      return res.status(400).json({ error: "eventIds debe ser un array" });
    }

    const eventsData = eventIds.map((eventId) => ({
      athleteId,
      eventId: Number(eventId),
    }));

    const result = await prisma.athleteEvent.createMany({
      data: eventsData,
      skipDuplicates: true,
    });

    res.json({ count: result.count });
  } catch (error) {
    console.error("Error assigning events to athlete:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
const puppeteer = require("puppeteer");

// Datos de ejemplo mientras mejoramos el scraping real
const SAMPLE_EVENTS = [
  {
    name: "UFC 300 - Las Vegas",
    date: "2026-05-15",
    location: "T-Mobile Arena, Las Vegas",
    sport: "MMA",
  },
  {
    name: "IBJJF Pan American Championship",
    date: "2026-06-10",
    location: "Miami Convention Center, Florida",
    sport: "Jiu Jitsu",
  },
  {
    name: "ONE Championship - Bangkok",
    date: "2026-05-25",
    location: "Impact Arena, Bangkok",
    sport: "Muay Thai",
  },
  {
    name: "Submission Underground 29",
    date: "2026-06-20",
    location: "Seattle, Washington",
    sport: "Jiu Jitsu",
  },
  {
    name: "Dana White's Contender Series",
    date: "2026-07-01",
    location: "Las Vegas, Nevada",
    sport: "MMA",
  },
  {
    name: "BJJEE World Jiu-Jitsu Expo",
    date: "2026-07-15",
    location: "Long Beach, California",
    sport: "Jiu Jitsu",
  },
  {
    name: "Glory Kickboxing",
    date: "2026-06-30",
    location: "Amsterdam, Netherlands",
    sport: "Muay Thai",
  },
  {
    name: "Bellator MMA",
    date: "2026-07-10",
    location: "San Diego, California",
    sport: "MMA",
  },
  {
    name: "Copa America Jiu-Jitsu",
    date: "2026-05-20",
    location: "São Paulo, Brazil",
    sport: "Jiu Jitsu",
  },
  {
    name: "King of the Ring Muay Thai",
    date: "2026-08-05",
    location: "Los Angeles, California",
    sport: "Muay Thai",
  },
];

async function scrapeTapologyEvents() {
  console.log("📍 Extrayendo eventos...");
  
  try {
    // Retornar datos de ejemplo inmediatamente
    // Esto permite que la app funcione mientras se optimiza el scraping real
    console.log("📊 Usando eventos de ejemplo...");
    return SAMPLE_EVENTS;
    
    // TODO: Descomentar cuando se resuelva el problema de Puppeteer
    /*
    let browser;
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 20000,
    });

    const page = await browser.newPage();
    await page.goto("https://www.tapology.com/events?country=US", {
      waitUntil: "networkidle0",
      timeout: 20000,
    });

    const liveEvents = await page.evaluate(() => {
      const data = [];
      // Scraping logic aquí
      return data;
    });

    await browser.close();
    return liveEvents.length > 0 ? liveEvents : SAMPLE_EVENTS;
    */
    
  } catch (error) {
    console.error("⚠️ Error en scraper:", error.message);
    console.log("📊 Retornando eventos de ejemplo por defecto");
    return SAMPLE_EVENTS;
  }
}

module.exports = { scrapeTapologyEvents };

if (require.main === module) {
  scrapeTapologyEvents().then((data) => {
    console.log(`\n✅ Total de eventos: ${data.length}`);
    console.log("\nEventos encontrados:");
    data.forEach((e, i) => {
      console.log(`${i + 1}. ${e.name} (${e.sport}) - ${e.date}`);
    });
    process.exit(0);
  }).catch(err => {
    console.error("❌ Error fatal:", err);
    process.exit(1);
  });
}
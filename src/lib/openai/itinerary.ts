import { getEnv } from "@/lib/env";
import { parseItineraryResponse } from "@/lib/planner/parse";
import { type Itinerary } from "@/lib/planner/schema";

type GenerateItineraryInput = {
  destination: string;
  dateRange: string;
  budget: "lean" | "standard" | "premium";
  vibe: string;
  replanReason?: string;
  previousItinerary?: Itinerary | null;
};

const PLACE_LIBRARY: Record<string, string[]> = {
  denmark: ["Nyhavn", "Tivoli Gardens", "Rosenborg Castle", "ARoS Aarhus Art Museum", "The Little Mermaid"],
  karnataka: ["Mysore Palace", "Hampi", "Nandi Hills", "Coorg Plantations", "Cubbon Park"],
  lisbon: ["Alfama", "Belém Tower", "Jerónimos Monastery", "LX Factory", "Miradouro da Senhora do Monte"],
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function parseDateRange(dateRange: string): { start: string; end: string; labels: string[] } {
  const today = new Date();
  const fallbackStart = new Date(today);
  const fallbackEnd = new Date(today);
  fallbackEnd.setDate(fallbackEnd.getDate() + 2);

  const isoMatches = dateRange.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  const startMatch = isoMatches[0];
  const endMatch = isoMatches[1];
  if (startMatch && endMatch) {
    const startDate = new Date(startMatch);
    const endDate = new Date(endMatch);

    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      const labels: string[] = [];
      const cursor = new Date(startDate);
      const maxDays = 7;
      while (cursor <= endDate && labels.length < maxDays) {
        labels.push(formatDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      if (labels.length > 0) {
        return {
          start: labels[0],
          end: labels[labels.length - 1],
          labels,
        };
      }
    }
  }

  const fallbackLabels = [0, 1, 2].map((offset) => {
    const date = new Date(fallbackStart);
    date.setDate(date.getDate() + offset);
    return formatDate(date);
  });

  return {
    start: formatDate(fallbackStart),
    end: formatDate(fallbackEnd),
    labels: fallbackLabels,
  };
}

function buildFallbackItinerary(input: GenerateItineraryInput): Itinerary {
  const tripName = `${input.destination} ${input.replanReason ? "Replan" : "Starter"}`;
  const parsedRange = parseDateRange(input.dateRange);
  const places =
    PLACE_LIBRARY[input.destination.trim().toLowerCase()] ??
    [
      `${input.destination} Old Town`,
      `${input.destination} Central Market`,
      `${input.destination} Riverfront`,
      `${input.destination} Local Museum`,
      `${input.destination} Sunset Point`,
    ];

  return {
    tripName,
    destination: input.destination,
    startDate: parsedRange.start,
    endDate: parsedRange.end,
    days: parsedRange.labels.map((dateLabel, index) => ({
      date: dateLabel,
      events: [
        {
          time: "09:00",
          title: "Breakfast + Orientation Walk",
          location: places[index % places.length] ?? input.destination,
          notes: `Start with a ${input.budget} budget-friendly cafe and a ${input.vibe} walking loop.`,
        },
        {
          time: "11:30",
          title: "Primary Attraction Visit",
          location: places[(index + 1) % places.length] ?? input.destination,
          notes: input.replanReason
            ? `Adjusted for replan context: ${input.replanReason}.`
            : "Reserved high-priority landmark and photo window.",
        },
        {
          time: "14:30",
          title: "Local Food + Culture Stop",
          location: places[(index + 2) % places.length] ?? input.destination,
          notes: "Try local cuisine, then add one culture-focused short stop.",
        },
        {
          time: "17:30",
          title: "Sunset / Leisure Block",
          location: places[(index + 3) % places.length] ?? input.destination,
          notes: "Keep 60-90 minutes flexible for weather, delays, or spontaneous detours.",
        },
      ],
    })),
  };
}

function buildUserPrompt(input: GenerateItineraryInput): string {
  const mode = input.replanReason ? "REPLAN" : "NEW_PLAN";

  return [
    `Mode: ${mode}`,
    `Destination: ${input.destination}`,
    `DateRange: ${input.dateRange}`,
    `Budget: ${input.budget}`,
    `Vibe: ${input.vibe}`,
    input.replanReason ? `ReplanReason: ${input.replanReason}` : "",
    input.previousItinerary ? `PreviousItineraryJSON: ${JSON.stringify(input.previousItinerary)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateItinerary(input: GenerateItineraryInput): Promise<Itinerary> {
  const env = getEnv();

  if (!env.OPENAI_API_KEY) {
    return buildFallbackItinerary(input);
  }

  const model = env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt = `You are a senior travel planner.
Return only strict JSON matching:
{
  "tripName": string,
  "destination": string,
  "startDate": string,
  "endDate": string,
  "days": [
    {
      "date": string,
      "events": [
        {"time": "HH:MM", "title": string, "location": string, "notes": string}
      ]
    }
  ]
}
Rules:
- Minimum 3 days (or realistic if user date range shorter)
- 4-6 events per day
- Include specific places/attractions, not generic placeholders
- Notes should mention logistics/tips/constraints
- No markdown, no extra keys, JSON only.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      return buildFallbackItinerary(input);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return buildFallbackItinerary(input);
    }

    const parsed = parseItineraryResponse(content);
    if (!parsed.success) {
      return buildFallbackItinerary(input);
    }

    return parsed.data;
  } catch {
    return buildFallbackItinerary(input);
  }
}

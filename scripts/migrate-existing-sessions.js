/**
 * Migration des sessions existantes (bowling-stats perso) vers Supabase.
 * Usage : node scripts/migrate-existing-sessions.js
 * Pré-requis : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
 *              + USER_ID = ton UUID Supabase (visible dans Auth > Users)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const USER_ID = process.env.SUPABASE_USER_ID; // à setter dans .env

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Sessions historiques extraites du dashboard perso
const sessions = [
  { date: "2023-06-16", scores: [164, 131, 136, 135, 126] },
  { date: "2023-07-12", scores: [129, 150, 117, 170, 139, 194, 116] },
  { date: "2023-09-13", scores: [104, 120, 110, 130, 169, 175] },
  { date: "2023-09-19", scores: [135, 185, 116, 193, 155, 126] },
  // 21/09/23 : données partielles, on skip (avg connu mais pas les scores individuels)
  { date: "2023-09-28", scores: [220, 149, 133, 176, 130] },
  { date: "2023-10-05", scores: [144, 161, 108, 141, 143, 124, 153, 166, 170, 155, 182, 174, 148, 130] },
  { date: "2024-01-06", scores: [148, 166, 128] },
  { date: "2024-01-10", scores: [167, 151, 173, 148, 198] },
  { date: "2024-01-17", scores: [151, 155, 147, 118, 180, 147] },
  { date: "2024-01-22", scores: [146, 106, 215] },
  { date: "2024-01-26", scores: [140, 165] },
  { date: "2024-01-27", scores: [159] },
  { date: "2024-03-02", scores: [170, 155, 161] },
  { date: "2024-03-05", scores: [150, 175, 195] },
  { date: "2024-03-15", scores: [182, 215, 177] },
  { date: "2024-03-29", scores: [147, 173, 160, 140, 209, 142, 148] },
  { date: "2024-04-23", scores: [159, 130, 138, 171, 189] },
  { date: "2024-04-25", scores: [183, 148, 202, 167, 167, 138] },
  { date: "2024-05-02", scores: [171, 131, 156] },
  { date: "2024-05-17", scores: [164, 165, 177] },
  { date: "2024-05-21", scores: [164, 107, 177, 147, 139, 133, 133, 175, 118] },
  { date: "2024-05-24", scores: [127, 166, 206] },
  { date: "2024-05-30", scores: [143] },
  { date: "2024-06-06", scores: [173, 134, 153, 152, 164, 198] },
  { date: "2024-09-26", scores: [161, 124, 149, 136, 137, 109, 131] },
  { date: "2025-03-11", scores: [139, 131, 151, 185, 195, 146, 188, 197, 192, 198, 147, 143] },
  { date: "2025-04-28", scores: [139, 165, 128, 180, 138, 132] },
  { date: "2025-09-05", scores: [155, 158, 138] },
  { date: "2025-11-19", scores: [136, 153, 110, 91, 198, 158, 194] },
  { date: "2025-11-26", scores: [186, 139, 195, 172, 162, 161] },
  { date: "2025-12-03", scores: [186, 154, 147, 175, 180, 117] },
  { date: "2025-12-10", scores: [132, 162, 155, 158, 120, 117] },
  { date: "2025-12-17", scores: [149, 133, 138] },
  { date: "2025-12-29", scores: [163, 121, 136, 171, 156] },
  { date: "2026-01-07", scores: [157, 148, 166, 162, 178, 145, 161, 109, 157, 143] },
  { date: "2026-01-14", scores: [171, 150, 126, 206, 158, 137] },
  { date: "2026-01-21", scores: [147, 136, 178, 145, 205, 190, 185, 164] },
  { date: "2026-01-28", scores: [148, 177, 165, 189, 143, 161, 133, 152, 136, 173] },
  { date: "2026-02-18", scores: [158, 176, 115, 213, 166, 205] },
  { date: "2026-02-25", scores: [127, 116, 145, 166, 171, 208, 232, 127, 152] },
  { date: "2026-03-04", scores: [142, 140, 165, 120, 149, 157, 154] },
  { date: "2026-03-11", scores: [177, 171, 141, 183, 164, 170, 154] },
  { date: "2026-03-18", scores: [139, 154, 169, 200, 186, 128, 183, 244, 175] },
  { date: "2026-03-25", scores: [193, 148, 166, 131, 174, 161, 173] },
  { date: "2026-04-01", scores: [156, 140, 158, 197, 193, 124] },
  { date: "2026-04-15", scores: [116, 173, 152, 114, 175, 136, 135] },
];

async function migrate() {
  if (!USER_ID) {
    console.error("Erreur : SUPABASE_USER_ID non défini dans .env");
    process.exit(1);
  }

  const rows = sessions.map(s => ({ user_id: USER_ID, date: s.date, scores: s.scores }));

  const { error, count } = await supabase
    .from("sessions")
    .insert(rows)
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Erreur migration :", error.message);
  } else {
    console.log(`Migration OK — ${rows.length} sessions insérées.`);
  }
}

migrate();

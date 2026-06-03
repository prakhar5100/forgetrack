"""
Seed muscle groups and exercises.
Works against both local SQLite (dev) and Turso (production).

Local dev:
    python seed.py

Against Turso (run once after deploying):
    TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... python seed.py
"""
from db import get_connection, init_db

MUSCLE_GROUPS = [
    ("Legs",     "#4ADE80", "🦵"),
    ("Abs",      "#FACC15", "💪"),
    ("Chest",    "#F97316", "🫁"),
    ("Back",     "#60A5FA", "🔙"),
    ("Biceps",   "#A78BFA", "💪"),
    ("Triceps",  "#F472B6", "💪"),
    ("Shoulders","#34D399", "🏋️"),
]

EXERCISES = [
    # Legs
    ("Barbell Back Squat",       "Legs", "Barbell",         "Quads, Glutes, Hamstrings", "Keep chest up, knees out, depth below parallel"),
    ("Leg Press",                "Legs", "Machine",         "Quads, Glutes",             "Don't lock out knees at top"),
    ("Romanian Deadlift",        "Legs", "Barbell",         "Hamstrings, Glutes",        "Hinge at hips, soft knee bend, bar close to body"),
    ("Bulgarian Split Squat",    "Legs", "Dumbbells",       "Quads, Glutes",             "Keep front shin vertical"),
    ("Leg Curl",                 "Legs", "Machine",         "Hamstrings",                "Full range of motion, squeeze at top"),
    ("Calf Raise",               "Legs", "Machine/BW",      "Calves",                    "Pause at top and bottom"),

    # Abs
    ("Plank",                    "Abs",  "Bodyweight",      "Core",                      "Neutral spine, breathe steadily"),
    ("Cable Crunch",             "Abs",  "Cable",           "Abs",                       "Round the lower back, focus on contraction"),
    ("Hanging Leg Raise",        "Abs",  "Pull-up bar",     "Lower Abs, Hip Flexors",    "Control the descent"),
    ("Russian Twist",            "Abs",  "Plate/Dumbbell",  "Obliques",                  "Rotate from the torso, not arms"),

    # Chest
    ("Barbell Bench Press",      "Chest","Barbell",         "Pecs, Anterior Deltoid, Triceps", "Retract scapula, arch slightly, drive through chest"),
    ("Incline Dumbbell Press",   "Chest","Dumbbells",       "Upper Pecs",                "30-45° incline, full stretch at bottom"),
    ("Cable Fly",                "Chest","Cable",           "Pecs",                      "Slight elbow bend, squeeze at centre"),
    ("Dumbbell Pullover",        "Chest","Dumbbell",        "Pecs, Lats",                "Keep elbows slightly bent throughout"),
    ("Push-Up",                  "Chest","Bodyweight",      "Pecs, Triceps",             "Full range, elbows 45° from body"),

    # Back
    ("Deadlift",                 "Back", "Barbell",         "Erectors, Traps, Glutes",   "Neutral spine, bar over mid-foot, big breath before lift"),
    ("Pull-Up",                  "Back", "Bodyweight",      "Lats, Biceps",              "Full dead hang to chin over bar"),
    ("Barbell Row",              "Back", "Barbell",         "Lats, Rhomboids, Rear Delt","45° torso, row to lower chest"),
    ("Lat Pulldown",             "Back", "Cable Machine",   "Lats",                      "Lean slightly back, pull to upper chest"),
    ("Seated Cable Row",         "Back", "Cable",           "Mid-Back, Lats",            "Chest up, squeeze shoulder blades together"),

    # Biceps
    ("Barbell Curl",             "Biceps","Barbell",        "Biceps",                    "Keep elbows fixed, full extension"),
    ("Incline Dumbbell Curl",    "Biceps","Dumbbells",      "Long head Biceps",          "Full stretch at bottom of movement"),
    ("Hammer Curl",              "Biceps","Dumbbells",      "Brachialis, Brachioradialis","Neutral grip, controlled tempo"),
    ("Preacher Curl",            "Biceps","Barbell/EZ-Bar", "Biceps",                    "Don't hyperextend at bottom"),

    # Triceps
    ("Close-Grip Bench Press",   "Triceps","Barbell",       "Triceps, Chest",            "Elbows tucked, shoulder-width grip"),
    ("Skull Crusher",            "Triceps","EZ-Bar",        "Triceps",                   "Lower to forehead, keep upper arms vertical"),
    ("Tricep Pushdown",          "Triceps","Cable",         "Triceps",                   "Lock elbows at sides, full extension"),
    ("Overhead Tricep Extension","Triceps","Dumbbell/Cable","Long head Triceps",          "Keep elbows close, lower behind head"),

    # Shoulders
    ("Overhead Press",           "Shoulders","Barbell",     "Anterior/Lateral Deltoid",  "Core tight, press straight up, avoid flaring elbows"),
    ("Lateral Raise",            "Shoulders","Dumbbells",   "Lateral Deltoid",           "Lead with elbows, slight forward lean"),
    ("Face Pull",                "Shoulders","Cable",       "Rear Deltoid, Rotator Cuff","Pull to forehead, externally rotate at top"),
    ("Arnold Press",             "Shoulders","Dumbbells",   "All three deltoid heads",   "Rotate palms as you press up"),
]



def seed():
    # Ensure tables exist first (safe even if already created)
    init_db()
    conn = get_connection()

    # ── Muscle groups ─────────────────────────────────────────────────────────
    mg_map = {}
    for name, color, icon in MUSCLE_GROUPS:
        existing = conn.execute(
            "SELECT id FROM muscle_groups WHERE name=?", (name,)
        ).fetchone()
        if existing:
            mg_map[name] = existing["id"]
            print(f"  [skip] muscle group: {name}")
        else:
            cur = conn.execute(
                "INSERT INTO muscle_groups (name, color_hex, icon) VALUES (?,?,?)",
                (name, color, icon),
            )
            mg_map[name] = cur.lastrowid
            print(f"  [add]  muscle group: {name}")

    conn.commit()

    # ── Exercises ─────────────────────────────────────────────────────────────
    for ex_name, mg_name, equipment, primary_muscles, cues in EXERCISES:
        mg_id = mg_map.get(mg_name)
        if mg_id is None:
            print(f"  [warn] unknown muscle group '{mg_name}' for exercise '{ex_name}'")
            continue
        existing = conn.execute(
            "SELECT id FROM exercises WHERE name=? AND muscle_group_id=?",
            (ex_name, mg_id),
        ).fetchone()
        if existing:
            print(f"  [skip] exercise: {ex_name}")
        else:
            conn.execute(
                """INSERT INTO exercises
                   (name, muscle_group_id, equipment, primary_muscles, cues)
                   VALUES (?,?,?,?,?)""",
                (ex_name, mg_id, equipment, primary_muscles, cues),
            )
            print(f"  [add]  exercise: {ex_name}")

    conn.commit()
    conn.close()
    print("\n✅ Seed complete.")


if __name__ == "__main__":
    seed()

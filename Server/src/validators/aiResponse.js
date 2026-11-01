export class AIValidationError extends Error {}

const num = (v, min, max, name) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw new AIValidationError(`${name} is invalid`);
  return v;
};
const str = (v, min, max, name) => {
  if (typeof v !== "string") throw new AIValidationError(`${name} is invalid`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw new AIValidationError(`${name} length is invalid`);
  return t;
};

export function validateAnalysis(raw) {
  if (!raw || typeof raw !== "object") throw new AIValidationError("not an object");
  if (raw.isFood === false) return { isFood: false };
  if (raw.isFood !== true) throw new AIValidationError("isFood missing");

  if (!Array.isArray(raw.ingredients) || raw.ingredients.length > 20)
    throw new AIValidationError("ingredients invalid");

  const result = {
    isFood: true,
    dishName: str(raw.dishName, 1, 100, "dishName"),
    ingredients: raw.ingredients.map((i) => ({
      name: str(i?.name, 1, 60, "ingredient name"),
      grams: num(i?.estimatedGrams, 0, 5000, "ingredient grams"),
    })),
    servingGrams: num(raw.estimatedServingGrams, 1, 5000, "servingGrams"),
    nutrition: {
      calories: num(raw.calories, 0, 5000, "calories"),
      protein: num(raw.proteinG, 0, 500, "protein"),
      carbs: num(raw.carbsG, 0, 1000, "carbs"),
      fat: num(raw.fatG, 0, 500, "fat"),
      fiber: raw.fiberG == null ? null : num(raw.fiberG, 0, 200, "fiber"),
    },
    confidence: ["low", "medium", "high"].includes(raw.confidence) ? raw.confidence : null,
    summary: str(raw.summary ?? "", 0, 300, "summary"),
    uncertaintyNotes: str(raw.uncertaintyNotes ?? "", 0, 300, "uncertaintyNotes"),
  };
  if (!result.confidence) throw new AIValidationError("confidence invalid");

  // Sanity check: calories should roughly match 4*protein + 4*carbs + 9*fat
  const n = result.nutrition;
  const fromMacros = 4 * n.protein + 4 * n.carbs + 9 * n.fat;
  if (n.calories > 50 && Math.abs(fromMacros - n.calories) > 0.35 * n.calories) {
    result.confidence = "low";
    result.uncertaintyNotes = (result.uncertaintyNotes + " Calories and macros do not match well.").trim();
  }
  const sumGrams = result.ingredients.reduce((s, i) => s + i.grams, 0);
  if (sumGrams > 0 && Math.abs(sumGrams - result.servingGrams) > 0.2 * result.servingGrams) {
   if (result.confidence === "high") result.confidence = "medium";
   result.uncertaintyNotes = (result.uncertaintyNotes + " Ingredient weights do not add up to the serving size.").trim();
}
  return result;
}
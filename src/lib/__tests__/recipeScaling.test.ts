import {
  roundAmount,
  scaleAmount,
  convertUnit,
  scaleIngredient,
  scaleIngredients,
  formatAmount,
} from "../recipeScaling";

describe("roundAmount", () => {
  it("returns 0 for 0", () => {
    expect(roundAmount(0)).toBe(0);
  });

  it("rounds very small values to 2 decimal places", () => {
    expect(roundAmount(0.05)).toBe(0.05);
    expect(roundAmount(0.1)).toBe(0.1);
  });

  it("rounds fractional values to nearest common fraction", () => {
    expect(roundAmount(0.24)).toBe(0.25);
    expect(roundAmount(0.48)).toBe(0.5);
    expect(roundAmount(0.65)).toBe(0.667);
    expect(roundAmount(0.74)).toBe(0.75);
    expect(roundAmount(0.34)).toBe(0.333);
    expect(roundAmount(0.13)).toBe(0.125);
  });

  it("rounds values 1-10 to nearest 0.25", () => {
    expect(roundAmount(1.1)).toBe(1);
    expect(roundAmount(1.3)).toBe(1.25);
    expect(roundAmount(2.6)).toBe(2.5);
    expect(roundAmount(3.9)).toBe(4);
  });

  it("rounds values >= 10 to nearest integer", () => {
    expect(roundAmount(10.4)).toBe(10);
    expect(roundAmount(10.6)).toBe(11);
    expect(roundAmount(25.3)).toBe(25);
  });
});

describe("scaleAmount", () => {
  it("returns undefined for undefined amount", () => {
    expect(scaleAmount(undefined, 4, 8)).toBeUndefined();
  });

  it("returns 0 for 0 amount", () => {
    expect(scaleAmount(0, 4, 8)).toBe(0);
  });

  it("doubles amount when doubling servings", () => {
    expect(scaleAmount(1, 4, 8)).toBe(2);
    expect(scaleAmount(2, 4, 8)).toBe(4);
  });

  it("halves amount when halving servings", () => {
    expect(scaleAmount(2, 4, 2)).toBe(1);
    expect(scaleAmount(1, 4, 2)).toBe(0.5);
  });

  it("returns original amount when servings are the same", () => {
    expect(scaleAmount(1.5, 4, 4)).toBe(1.5);
  });

  it("handles scaling to 1 serving", () => {
    expect(scaleAmount(4, 4, 1)).toBe(1);
  });

  it("handles invalid recipe servings gracefully", () => {
    expect(scaleAmount(2, 0, 4)).toBe(2);
    expect(scaleAmount(2, -1, 4)).toBe(2);
  });

  it("handles non-even scaling with rounding", () => {
    const result = scaleAmount(1, 4, 3);
    expect(result).toBe(0.75);
  });
});

describe("convertUnit", () => {
  describe("imperial to metric", () => {
    it("converts cups to ml", () => {
      const result = convertUnit(1, "cup", "metric");
      expect(result.unit).toBe("ml");
      expect(result.amount).toBeGreaterThan(230);
      expect(result.amount).toBeLessThan(240);
    });

    it("converts oz to g", () => {
      const result = convertUnit(1, "oz", "metric");
      expect(result.unit).toBe("g");
      expect(result.amount).toBeGreaterThanOrEqual(28);
      expect(result.amount).toBeLessThanOrEqual(29);
    });

    it("converts tbsp to ml", () => {
      const result = convertUnit(1, "tbsp", "metric");
      expect(result.unit).toBe("ml");
      expect(result.amount).toBeGreaterThanOrEqual(14);
      expect(result.amount).toBeLessThanOrEqual(15);
    });

    it("converts tsp to ml", () => {
      const result = convertUnit(1, "tsp", "metric");
      expect(result.unit).toBe("ml");
      expect(result.amount).toBeGreaterThan(4);
      expect(result.amount).toBeLessThan(6);
    });

    it("converts lb to kg", () => {
      const result = convertUnit(1, "lb", "metric");
      expect(result.unit).toBe("kg");
      expect(result.amount).toBeCloseTo(0.5, 0);
    });

    it("converts quart to L", () => {
      const result = convertUnit(1, "quart", "metric");
      expect(result.unit).toBe("L");
      expect(result.amount).toBeCloseTo(1, 0);
    });

    it("converts °F to °C", () => {
      const result = convertUnit(350, "°F", "metric");
      expect(result.unit).toBe("°C");
      expect(result.amount).toBeCloseTo(177, 0);
    });
  });

  describe("metric to imperial", () => {
    it("converts g to oz", () => {
      const result = convertUnit(100, "g", "imperial");
      expect(result.unit).toBe("oz");
      expect(result.amount).toBeGreaterThan(3);
      expect(result.amount).toBeLessThan(4);
    });

    it("converts ml to fl oz", () => {
      const result = convertUnit(250, "ml", "imperial");
      expect(result.unit).toBe("fl oz");
      expect(result.amount).toBeGreaterThan(8);
      expect(result.amount).toBeLessThan(9);
    });

    it("converts kg to lb", () => {
      const result = convertUnit(1, "kg", "imperial");
      expect(result.unit).toBe("lb");
      expect(result.amount).toBeCloseTo(2.25, 0);
    });

    it("converts °C to °F", () => {
      const result = convertUnit(180, "°C", "imperial");
      expect(result.unit).toBe("°F");
      expect(result.amount).toBeCloseTo(356, 0);
    });
  });

  describe("non-convertible units", () => {
    it("does not convert pieces", () => {
      const result = convertUnit(3, "pieces", "metric");
      expect(result).toEqual({ amount: 3, unit: "pieces" });
    });

    it("does not convert cloves", () => {
      const result = convertUnit(2, "cloves", "metric");
      expect(result).toEqual({ amount: 2, unit: "cloves" });
    });

    it("does not convert empty unit", () => {
      const result = convertUnit(1, "", "metric");
      expect(result).toEqual({ amount: 1, unit: "" });
    });

    it("does not convert pinch", () => {
      const result = convertUnit(1, "pinch", "imperial");
      expect(result).toEqual({ amount: 1, unit: "pinch" });
    });
  });

  describe("same system", () => {
    it("does not convert metric to metric", () => {
      const result = convertUnit(100, "g", "metric");
      expect(result).toEqual({ amount: 100, unit: "g" });
    });

    it("does not convert imperial to imperial", () => {
      const result = convertUnit(2, "cup", "imperial");
      expect(result).toEqual({ amount: 2, unit: "cup" });
    });
  });
});

describe("scaleIngredient", () => {
  const baseIngredient = {
    name: "flour",
    amount: 2,
    unit: "cups",
    preparation: "sifted",
    sortOrder: 0,
  };

  it("scales amount based on servings ratio", () => {
    const result = scaleIngredient(baseIngredient, 4, 8);
    expect(result.amount).toBe(4);
    expect(result.unit).toBe("cups");
    expect(result.name).toBe("flour");
  });

  it("scales and converts units when targetSystem provided", () => {
    const result = scaleIngredient(baseIngredient, 4, 4, "metric");
    expect(result.unit).toBe("ml");
    expect(result.amount).toBeGreaterThan(400);
  });

  it("preserves original amount and unit", () => {
    const result = scaleIngredient(baseIngredient, 4, 8, "metric");
    expect(result.originalAmount).toBe(2);
    expect(result.originalUnit).toBe("cups");
  });

  it("handles ingredient without amount", () => {
    const noAmount = { name: "salt", sortOrder: 1 };
    const result = scaleIngredient(noAmount, 4, 8);
    expect(result.amount).toBeUndefined();
    expect(result.name).toBe("salt");
  });

  it("preserves preparation and optional fields", () => {
    const ing = { ...baseIngredient, isOptional: true, group: "dry" };
    const result = scaleIngredient(ing, 4, 4);
    expect(result.preparation).toBe("sifted");
    expect(result.isOptional).toBe(true);
    expect(result.group).toBe("dry");
  });
});

describe("scaleIngredients", () => {
  const ingredients = [
    { name: "flour", amount: 2, unit: "cups", sortOrder: 0 },
    { name: "sugar", amount: 1, unit: "cup", sortOrder: 1 },
    { name: "eggs", amount: 3, unit: "pieces", sortOrder: 2 },
  ];

  it("scales all ingredients", () => {
    const results = scaleIngredients(ingredients, 4, 8);
    expect(results).toHaveLength(3);
    expect(results[0].amount).toBe(4);
    expect(results[1].amount).toBe(2);
    expect(results[2].amount).toBe(6);
  });

  it("converts all ingredients when target system specified", () => {
    const results = scaleIngredients(ingredients, 4, 4, "metric");
    expect(results[0].unit).toBe("ml");
    expect(results[1].unit).toBe("ml");
    expect(results[2].unit).toBe("pieces"); // non-convertible
  });
});

describe("formatAmount", () => {
  it("returns empty string for undefined", () => {
    expect(formatAmount(undefined)).toBe("");
  });

  it("formats whole numbers", () => {
    expect(formatAmount(2)).toBe("2");
    expect(formatAmount(10)).toBe("10");
  });

  it("formats common fractions", () => {
    expect(formatAmount(0.25)).toBe("1/4");
    expect(formatAmount(0.5)).toBe("1/2");
    expect(formatAmount(0.75)).toBe("3/4");
    expect(formatAmount(0.333)).toBe("1/3");
    expect(formatAmount(0.667)).toBe("2/3");
  });

  it("formats mixed numbers with fractions", () => {
    expect(formatAmount(1.5)).toBe("1 1/2");
    expect(formatAmount(2.25)).toBe("2 1/4");
    expect(formatAmount(3.75)).toBe("3 3/4");
  });

  it("formats decimal values that are not common fractions", () => {
    // 1.1 → frac=0.1, not in fraction map → fallback decimal "1.1"
    expect(formatAmount(1.1)).toBe("1.1");
    // 5.3 → frac=roundAmount(0.3)=0.333 → "5 1/3"
    expect(formatAmount(5.3)).toBe("5 1/3");
  });
});

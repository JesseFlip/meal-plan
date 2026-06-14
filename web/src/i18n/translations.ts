// FridgePlan i18n translations
// All user-facing strings extracted per Constitutional Principle 5

export type Language = 'en' | 'es'

export type TranslationKey = keyof typeof translations.en

const translations = {
  en: {
    // App header
    'app.title': 'Meal Plan',
    'app.weekOf': 'Week of',

    // View tabs
    'nav.mealPlan': 'Meal Plan',
    'nav.groceries': 'Groceries',
    'nav.ingredients': 'Ingredients',

    // Meal grid
    'meal.breakfast': 'Breakfast',
    'meal.lunch': 'Lunch',
    'meal.dinner': 'Dinner',
    'days.mon': 'MON',
    'days.tue': 'TUE',
    'days.wed': 'WED',
    'days.thu': 'THU',
    'days.fri': 'FRI',
    'days.sat': 'SAT',
    'days.sun': 'SUN',

    // Sync status
    'sync.live': 'Live',
    'sync.manual': 'Manual',
    'sync.pending': 'changes pending',
    'sync.connecting': 'Connecting',
    'sync.offline': 'Offline',

    // Grocery categories
    'grocery.produce': 'Produce',
    'grocery.protein': 'Protein',
    'grocery.dairy': 'Dairy',
    'grocery.pantry': 'Pantry',
    'grocery.other': 'Other',

    // Grocery actions
    'grocery.addPlaceholder': 'Add something to the list...',
    'grocery.addButton': 'Add item',
    'grocery.fromPlan': 'From Plan',
    'grocery.refresh': 'Refresh from Plan',
    'grocery.clearBought': 'Clear Bought',

    // Footer
    'footer.hint': 'tap any cell to edit · changes sync live across devices',

    // Meal editor
    'meal.protein': 'Protein',
    'meal.veggie': 'Veggie',
    'meal.carb': 'Carb',
    'meal.fat': 'Fat',
    'meal.selectProtein': 'Select protein...',
    'meal.selectVeggie': 'Select veggie...',
    'meal.selectCarb': 'Select carb...',
    'meal.selectFat': 'Select fat...',
    'meal.addNew': 'Add new',
    'meal.addButton': 'Add',
    'meal.cancel': 'Cancel',
    'meal.save': 'Save',
    'meal.addCell': '+ add',
    'meal.guidelineBreakfastLunch': 'Include: lean protein + green leafy veggies + low-starch carb',
    'meal.guidelineDinner': 'Include: lean protein + green leafy veggies + healthy fat',
    'meal.newItem': 'New',
    'meal.modeSimple': 'Simple',
    'meal.modeDetailed': 'Detailed',
    'meal.mealName': 'Meal Name',
    'meal.mealNamePlaceholder': 'e.g., Chicken Stir Fry',

    // Settings
    'settings.colorPicker': 'Text color picker',
    'settings.textColor': 'Text Color',
    'settings.presets': 'Presets',
    'settings.nightMode': 'Night mode',
    'settings.nightModeOn': 'Switch to night mode',
    'settings.nightModeOff': 'Switch to day mode',

    // Meal Generator
    'mealGenerator.title': 'AI Meal Generator',
    'mealGenerator.subtitle': 'Generate healthy meal suggestions based on your available ingredients',
    'mealGenerator.numMeals': 'Number of Meals',
    'mealGenerator.dietaryPreferences': 'Dietary Preferences (Optional)',
    'mealGenerator.dietaryPlaceholder': 'e.g., vegetarian, gluten-free, low-carb...',
    'mealGenerator.generate': 'Generate Meals',
    'mealGenerator.generating': 'Generating...',
    'mealGenerator.generatedMeals': 'Generated Meals',
    'mealGenerator.generateNew': 'Generate New',
    'mealGenerator.apply': 'Apply',
    'mealGenerator.openGenerator': 'Generate Meals with AI',

    // Ingredient Bank
    'ingredients.title': 'Ingredient Bank',
    'ingredients.subtitle': 'Manage your available ingredients',
    'ingredients.proteins': 'Proteins',
    'ingredients.veggies': 'Veggies',
    'ingredients.carbs': 'Carbs',
    'ingredients.fats': 'Fats',
    'ingredients.addPlaceholder': 'Add new ingredient...',
    'ingredients.add': 'Add',
    'ingredients.delete': 'Delete',
    'ingredients.empty': 'No ingredients yet. Add some to get started!',
  },

  es: {
    // App header
    'app.title': 'Plan de Comidas',
    'app.weekOf': 'Semana del',

    // View tabs
    'nav.mealPlan': 'Plan de Comidas',
    'nav.groceries': 'Lista de Compras',
    'nav.ingredients': 'Ingredientes',

    // Meal grid
    'meal.breakfast': 'Desayuno',
    'meal.lunch': 'Almuerzo',
    'meal.dinner': 'Cena',
    'days.mon': 'LUN',
    'days.tue': 'MAR',
    'days.wed': 'MIÉ',
    'days.thu': 'JUE',
    'days.fri': 'VIE',
    'days.sat': 'SÁB',
    'days.sun': 'DOM',

    // Sync status
    'sync.live': 'En Vivo',
    'sync.manual': 'Manual',
    'sync.pending': 'cambios pendientes',
    'sync.connecting': 'Conectando',
    'sync.offline': 'Sin Conexión',

    // Grocery categories
    'grocery.produce': 'Frutas y Verduras',
    'grocery.protein': 'Proteínas',
    'grocery.dairy': 'Lácteos',
    'grocery.pantry': 'Despensa',
    'grocery.other': 'Otros',

    // Grocery actions
    'grocery.addPlaceholder': 'Agrega algo a la lista...',
    'grocery.addButton': 'Agregar',
    'grocery.fromPlan': 'Del Plan',
    'grocery.refresh': 'Actualizar desde el Plan',
    'grocery.clearBought': 'Limpiar Comprados',

    // Footer
    'footer.hint': 'toca cualquier celda para editar · los cambios se sincronizan en tiempo real',

    // Meal editor
    'meal.protein': 'Proteína',
    'meal.veggie': 'Verdura',
    'meal.carb': 'Carbohidrato',
    'meal.fat': 'Grasa',
    'meal.selectProtein': 'Selecciona proteína...',
    'meal.selectVeggie': 'Selecciona verdura...',
    'meal.selectCarb': 'Selecciona carbohidrato...',
    'meal.selectFat': 'Selecciona grasa...',
    'meal.addNew': 'Agregar nueva',
    'meal.addButton': 'Agregar',
    'meal.cancel': 'Cancelar',
    'meal.save': 'Guardar',
    'meal.addCell': '+ agregar',
    'meal.guidelineBreakfastLunch': 'Incluye: proteína magra + verduras de hoja verde + carbohidrato bajo en almidón',
    'meal.guidelineDinner': 'Incluye: proteína magra + verduras de hoja verde + grasa saludable',
    'meal.newItem': 'Nueva',
    'meal.modeSimple': 'Simple',
    'meal.modeDetailed': 'Detallado',
    'meal.mealName': 'Nombre de la Comida',
    'meal.mealNamePlaceholder': 'ej., Pollo Salteado',

    // Settings
    'settings.colorPicker': 'Selector de color',
    'settings.textColor': 'Color de Texto',
    'settings.presets': 'Preestablecidos',
    'settings.nightMode': 'Modo nocturno',
    'settings.nightModeOn': 'Activar modo nocturno',
    'settings.nightModeOff': 'Activar modo día',

    // Meal Generator
    'mealGenerator.title': 'Generador de Comidas con IA',
    'mealGenerator.subtitle': 'Genera sugerencias de comidas saludables basadas en tus ingredientes',
    'mealGenerator.numMeals': 'Número de Comidas',
    'mealGenerator.dietaryPreferences': 'Preferencias Alimentarias (Opcional)',
    'mealGenerator.dietaryPlaceholder': 'ej., vegetariano, sin gluten, bajo en carbohidratos...',
    'mealGenerator.generate': 'Generar Comidas',
    'mealGenerator.generating': 'Generando...',
    'mealGenerator.generatedMeals': 'Comidas Generadas',
    'mealGenerator.generateNew': 'Generar Nuevas',
    'mealGenerator.apply': 'Aplicar',
    'mealGenerator.openGenerator': 'Generar Comidas con IA',

    // Ingredient Bank
    'ingredients.title': 'Banco de Ingredientes',
    'ingredients.subtitle': 'Administra tus ingredientes disponibles',
    'ingredients.proteins': 'Proteínas',
    'ingredients.veggies': 'Verduras',
    'ingredients.carbs': 'Carbohidratos',
    'ingredients.fats': 'Grasas',
    'ingredients.addPlaceholder': 'Agrega un ingrediente...',
    'ingredients.add': 'Agregar',
    'ingredients.delete': 'Eliminar',
    'ingredients.empty': '¡No hay ingredientes aún. Agrega algunos para empezar!',
  },
}

export default translations

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
  },

  es: {
    // App header
    'app.title': 'Plan de Comidas',
    'app.weekOf': 'Semana del',

    // View tabs
    'nav.mealPlan': 'Plan de Comidas',
    'nav.groceries': 'Compras',

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
    'grocery.produce': 'Productos Frescos',
    'grocery.protein': 'Proteínas',
    'grocery.dairy': 'Lácteos',
    'grocery.pantry': 'Despensa',
    'grocery.other': 'Otros',

    // Grocery actions
    'grocery.addPlaceholder': 'Agregar algo a la lista...',
    'grocery.addButton': 'Agregar artículo',
    'grocery.fromPlan': 'Del Plan',
    'grocery.refresh': 'Actualizar del Plan',
    'grocery.clearBought': 'Limpiar Comprados',

    // Footer
    'footer.hint': 'toca cualquier celda para editar · los cambios se sincronizan en vivo',
  },
}

export default translations

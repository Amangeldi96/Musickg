// ==========================================
// МЕНЮ ЖАНА ТЕМА БАШКАРУУ (header.js)
// ==========================================

// 1. Менюну ачуу/жабуу
window.toggleMenu = function() {
    console.log("Меню иштеди");
    document.body.classList.toggle('menu-open');
};

// 2. Теманы алмаштыруу
window.changeTheme = function(themeName) {
    const themes = ['light', 'dark', 'gold', 'green', 'red'];
    
    // Эски темаларды өчүрүү
    document.body.classList.remove(...themes);
    document.documentElement.classList.remove(...themes);
    
    // Жаңы теманы кошуу
    document.body.classList.add(themeName);
    document.documentElement.classList.add(themeName);
    
    // Тандоону эстеп калуу
    localStorage.setItem('selected-app-theme', themeName);
    console.log("Тема алмашты: " + themeName);
};

// 3. Баракча жүктөлгөндө теманы калыбына келтирүү
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('selected-app-theme') || 'dark';
    window.changeTheme(savedTheme);
});



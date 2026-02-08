/**
 * Fighting Fantasy book list
 * Original series (1982-1995) - 59 books
 */

const BOOKS = [
    { number: 1, title: "The Warlock of Firetop Mountain" },
    { number: 2, title: "The Citadel of Chaos" },
    { number: 3, title: "The Forest of Doom" },
    { number: 4, title: "Starship Traveller" },
    { number: 5, title: "City of Thieves" },
    { number: 6, title: "Deathtrap Dungeon" },
    { number: 7, title: "Island of the Lizard King" },
    { number: 8, title: "Scorpion Swamp" },
    { number: 9, title: "Caverns of the Snow Witch" },
    { number: 10, title: "House of Hell" },
    { number: 11, title: "Talisman of Death" },
    { number: 12, title: "Space Assassin" },
    { number: 13, title: "Freeway Fighter" },
    { number: 14, title: "Temple of Terror" },
    { number: 15, title: "The Rings of Kether" },
    { number: 16, title: "Seas of Blood" },
    { number: 17, title: "Appointment with F.E.A.R." },
    { number: 18, title: "Rebel Planet" },
    { number: 19, title: "Demons of the Deep" },
    { number: 20, title: "Sword of the Samurai" },
    { number: 21, title: "Trial of Champions" },
    { number: 22, title: "Robot Commando" },
    { number: 23, title: "Masks of Mayhem" },
    { number: 24, title: "Creature of Havoc" },
    { number: 25, title: "Beneath Nightmare Castle" },
    { number: 26, title: "Crypt of the Sorcerer" },
    { number: 27, title: "Star Strider" },
    { number: 28, title: "Phantoms of Fear" },
    { number: 29, title: "Midnight Rogue" },
    { number: 30, title: "Chasms of Malice" },
    { number: 31, title: "Battleblade Warrior" },
    { number: 32, title: "Slaves of the Abyss" },
    { number: 33, title: "Sky Lord" },
    { number: 34, title: "Stealer of Souls" },
    { number: 35, title: "Daggers of Darkness" },
    { number: 36, title: "Armies of Death" },
    { number: 37, title: "Portal of Evil" },
    { number: 38, title: "Vault of the Vampire" },
    { number: 39, title: "Fangs of Fury" },
    { number: 40, title: "Dead of Night" },
    { number: 41, title: "Master of Chaos" },
    { number: 42, title: "Black Vein Prophecy" },
    { number: 43, title: "The Keep of the Lich-Lord" },
    { number: 44, title: "Legend of the Shadow Warriors" },
    { number: 45, title: "Spectral Stalkers" },
    { number: 46, title: "Tower of Destruction" },
    { number: 47, title: "The Crimson Tide" },
    { number: 48, title: "Moonrunner" },
    { number: 49, title: "Siege of Sardath" },
    { number: 50, title: "Return to Firetop Mountain" },
    { number: 51, title: "Island of the Undead" },
    { number: 52, title: "Night Dragon" },
    { number: 53, title: "Spellbreaker" },
    { number: 54, title: "Legend of Zagor" },
    { number: 55, title: "Deathmoor" },
    { number: 56, title: "Knights of Doom" },
    { number: 57, title: "Magehunter" },
    { number: 58, title: "Revenge of the Vampire" },
    { number: 59, title: "Curse of the Mummy" },
    // Scholastic relaunch (2002-2007)
    { number: 60, title: "Bloodbones" },
    { number: 61, title: "Eye of the Dragon" },
    // Modern era (2017+)
    { number: 62, title: "The Gates of Death" },
    { number: 63, title: "The Port of Peril" },
    { number: 64, title: "Assassins of Allansia" },
    { number: 65, title: "Crystal of Storms" },
    { number: 66, title: "The Shadow of the Giants" },
    { number: 67, title: "Secrets of Salamonis" },
];

/**
 * Get a book by number
 * @param {number} number - The book number
 * @returns {Object|undefined} The book object or undefined
 */
function getBook(number) {
    return BOOKS.find(b => b.number === number);
}

/**
 * Search books by number or title
 * @param {string} query - Search query
 * @returns {Array} Matching books
 */
function searchBooks(query) {
    const q = query.toLowerCase().trim();
    if (!q) return BOOKS;

    // If query is a number, prioritize exact match
    const num = parseInt(q, 10);
    if (!isNaN(num)) {
        const exact = BOOKS.filter(b => b.number === num);
        if (exact.length > 0) return exact;
        // Also match books containing that number
        return BOOKS.filter(b => b.number.toString().includes(q));
    }

    // Text search in title
    return BOOKS.filter(b => b.title.toLowerCase().includes(q));
}

export { BOOKS, getBook, searchBooks };

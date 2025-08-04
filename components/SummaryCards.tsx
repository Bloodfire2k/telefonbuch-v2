'use client';

interface SummaryCardsProps {
  contacts: Array<{
    addressBook?: string;
    category?: string;
  }>;
}

export default function SummaryCards({ contacts }: SummaryCardsProps) {
  // Gruppiere Kontakte nach Adressbuch/Kategorie
  const groupedContacts = contacts.reduce((acc, contact) => {
    const key = contact.addressBook || contact.category || 'Sonstige';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sortiere nach Anzahl (absteigend)
  const sortedGroups = Object.entries(groupedContacts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3); // Zeige nur die Top 3

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {sortedGroups.map(([category, count]) => (
        <div key={category} className="summary-card bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800 mb-1">
              {category}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
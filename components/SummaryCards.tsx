import React from 'react';
import { User, Mail, Phone, Building } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface SummaryCardsProps {
  contacts: Contact[];
}

export default function SummaryCards({ contacts }: SummaryCardsProps) {
  const totalContacts = contacts.length;
  const contactsWithEmail = contacts.filter(c => c.email).length;
  const contactsWithPhone = contacts.filter(c => c.phone).length;
  const contactsWithCompany = contacts.filter(c => c.company).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Gesamt</h3>
            <p className="text-xs font-medium text-gray-500">{totalContacts} Kontakte</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-green-100">
            <Mail className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Mit E-Mail</h3>
            <p className="text-xs font-medium text-gray-500">{contactsWithEmail} Kontakte</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-yellow-100">
            <Phone className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Mit Telefon</h3>
            <p className="text-xs font-medium text-gray-500">{contactsWithPhone} Kontakte</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-purple-100">
            <Building className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Mit Firma</h3>
            <p className="text-xs font-medium text-gray-500">{contactsWithCompany} Kontakte</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
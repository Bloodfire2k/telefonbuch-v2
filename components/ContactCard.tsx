'use client';

import { Phone, Mail, User, Printer, Smartphone, PhoneCall } from 'lucide-react';

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    email?: string;
    emails?: string[];
    phone?: string;
    phones?: {
      type: string;
      number: string;
    }[];
    company?: string;
    title?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      full?: string;
    };
    website?: string;
    birthday?: string;
    notes?: string;
    addressBook?: string;
    category?: string;
  };
}

export default function ContactCard({ contact }: ContactCardProps) {
  // Funktion um das passende Icon für den Telefon-Typ zu bestimmen
  const getPhoneIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('handy') || lowerType.includes('mobile') || lowerType.includes('cell')) {
      return <Smartphone className="w-4 h-4 text-gray-400" />;
    } else if (lowerType.includes('fax')) {
      return <Printer className="w-4 h-4 text-gray-400" />;
    } else {
      return <Phone className="w-4 h-4 text-gray-400" />;
    }
  };

  // Sortiere alle Kontaktdaten nach gewünschter Reihenfolge
  const sortedContactData = () => {
    const data: Array<{ type: 'handy' | 'email' | 'phone' | 'fax' | 'address' | 'website' | 'notes', content: any }> = [];

    // Handy-Nummern
    if (contact.phones) {
      contact.phones.filter(phone => 
        phone.type.toLowerCase().includes('handy') || 
        phone.type.toLowerCase().includes('mobile') || 
        phone.type.toLowerCase().includes('cell')
      ).forEach(phone => {
        data.push({ type: 'handy', content: phone });
      });
    }

    // E-Mail-Adressen
    if (contact.emails && contact.emails.length > 0) {
      contact.emails.forEach(email => {
        data.push({ type: 'email', content: email });
      });
    } else if (contact.email) {
      data.push({ type: 'email', content: contact.email });
    }

    // Telefonnummern (ohne Handy und Fax)
    if (contact.phones) {
      contact.phones.filter(phone => 
        !phone.type.toLowerCase().includes('handy') && 
        !phone.type.toLowerCase().includes('mobile') && 
        !phone.type.toLowerCase().includes('cell') &&
        !phone.type.toLowerCase().includes('fax')
      ).forEach(phone => {
        data.push({ type: 'phone', content: phone });
      });
    }

    // Fax-Nummern
    if (contact.phones) {
      contact.phones.filter(phone => 
        phone.type.toLowerCase().includes('fax')
      ).forEach(phone => {
        data.push({ type: 'fax', content: phone });
      });
    }

    // Adresse
    if (contact.address && contact.address.full) {
      data.push({ type: 'address', content: contact.address.full });
    }

    // Website
    if (contact.website) {
      data.push({ type: 'website', content: contact.website });
    }

    // Notizen
    if (contact.notes) {
      data.push({ type: 'notes', content: contact.notes });
    }

    return data;
  };

  const contactData = sortedContactData();

  return (
    <div className="contact-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {contact.name}
          </h3>
          
          {contact.company && (
            <p className="text-sm text-gray-600 mb-1">
              {contact.company}
            </p>
          )}
          
          {contact.title && (
            <p className="text-xs text-gray-500 mb-2">
              {contact.title}
            </p>
          )}
        </div>
        
        {(contact.addressBook || contact.category) && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {contact.addressBook || contact.category}
          </span>
        )}
      </div>

      <div className="space-y-2 mt-3">
        {contactData.map((item, index) => {
          switch (item.type) {
            case 'handy':
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`tel:${item.content.number.replace(/\s/g, '')}`}
                    className="text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {item.content.number}
                  </a>
                </div>
              );
            
            case 'email':
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`mailto:${item.content}`}
                    className="text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {item.content}
                  </a>
                </div>
              );
            
            case 'phone':
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`tel:${item.content.number.replace(/\s/g, '')}`}
                    className="text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {item.content.number}
                  </a>
                </div>
              );
            
            case 'fax':
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Printer className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`tel:${item.content.number.replace(/\s/g, '')}`}
                    className="text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {item.content.number}
                  </a>
                </div>
              );
            
            case 'address':
              return (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{item.content}</span>
                </div>
              );
            
            case 'website':
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Printer className="w-4 h-4 text-gray-400" />
                  <a 
                    href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {item.content}
                  </a>
                </div>
              );
            
            case 'notes':
              return (
                <div key={index} className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                  {item.content}
                </div>
              );
            
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
} 
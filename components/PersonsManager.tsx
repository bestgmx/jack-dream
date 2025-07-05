import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { Person } from '../types.ts';

// --- SVG Icons --- //
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const IconCancel = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

interface PersonsManagerProps {
    persons: Person[];
    setPersons: React.Dispatch<React.SetStateAction<Person[]>>;
}

export const PersonsManager: React.FC<PersonsManagerProps> = ({ persons, setPersons }) => {
  const { t } = useI18n();
  const [newPersonName, setNewPersonName] = useState('');
  const [editingPerson, setEditingPerson] = useState<{id: number, name: string} | null>(null);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      setPersons(prevPersons => [...prevPersons, { id: Date.now(), name: newPersonName.trim() }]);
      setNewPersonName('');
    }
  };

  const handleDeletePerson = (id: number) => {
    setPersons(persons.filter(p => p.id !== id));
  };
  
  const handleStartEdit = (person: Person) => {
      setEditingPerson({ id: person.id, name: person.name });
  };
  
  const handleCancelEdit = () => {
      setEditingPerson(null);
  };
  
  const handleSaveEdit = () => {
      if(editingPerson && editingPerson.name.trim()) {
          setPersons(persons.map(p => p.id === editingPerson.id ? { ...p, name: editingPerson.name.trim() } : p));
          setEditingPerson(null);
      }
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 w-full">
      <h3 className="font-bold text-slate-800 text-xl mb-2">{t('personsCardTitle')}</h3>
      <p className="text-sm text-slate-500 mb-6">{t('personsCardDescription')}</p>

      {/* Add Person Form */}
      <form onSubmit={handleAddPerson} className="flex flex-col sm:flex-row gap-3 mb-6">
        <label htmlFor="newPersonName" className="sr-only">{t('personNameLabel')}</label>
        <input
          id="newPersonName"
          type="text"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          placeholder={t('addPersonPlaceholder')}
          className="flex-grow w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform hover:scale-105"
        >
          <IconPlus />
          <span>{t('addPersonButton')}</span>
        </button>
      </form>

      {/* Persons List */}
      <div className="space-y-3">
        {persons.map(person => (
          <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80 transition-all">
            {editingPerson?.id === person.id ? (
                // --- Edit View ---
                <>
                    <label htmlFor={`editPersonName_${person.id}`} className="sr-only">{t('personNameLabel')}</label>
                    <input 
                        id={`editPersonName_${person.id}`}
                        type="text"
                        value={editingPerson.name}
                        onChange={(e) => setEditingPerson({...editingPerson, name: e.target.value})}
                        className="flex-grow px-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                        autoFocus
                    />
                    <div className="flex items-center gap-2 ml-3 rtl:mr-3">
                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 p-1.5 rounded-full hover:bg-green-100 transition-colors" aria-label={t('saveButton')}><IconSave /></button>
                        <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors" aria-label={t('cancelButton')}><IconCancel /></button>
                    </div>
                </>
            ) : (
                // --- Display View ---
                <>
                    <span className="text-slate-800 font-medium">{person.name}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleStartEdit(person)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition-colors" aria-label={t('editButton')}><IconEdit /></button>
                        <button onClick={() => handleDeletePerson(person.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-colors" aria-label={t('deleteButton')}><IconTrash /></button>
                    </div>
                </>
            )}
          </div>
        ))}
         {persons.length === 0 && (
            <p className="text-center text-slate-500 py-4">{t('personsCardDescription')}</p>
        )}
      </div>
    </div>
  );
};
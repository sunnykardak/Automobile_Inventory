import React, { useState } from 'react';

export interface LabourChargeOption {
  id: number;
  name: string;
  amount: number;
}

interface LabourChargesPolicyFormProps {
  options: LabourChargeOption[];
  setOptions: (opts: LabourChargeOption[]) => void;
}

export const LabourChargesPolicyForm: React.FC<LabourChargesPolicyFormProps> = ({ options, setOptions }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);

  const handleAdd = () => {
    if (!name || amount <= 0) return;
    setOptions([...options, { id: Date.now(), name, amount }]);
    setName('');
    setAmount(0);
  };

  const handleRemove = (id: number) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Labour Charges Policy</h2>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Charge Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <input
          type="number"
          min="0"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="px-2 py-1 border rounded"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
      </div>
      <ul className="space-y-2">
        {options.map(opt => (
          <li key={opt.id} className="flex justify-between items-center border p-2 rounded">
            <span>{opt.name} - ₹{opt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <button onClick={() => handleRemove(opt.id)} className="text-red-600">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

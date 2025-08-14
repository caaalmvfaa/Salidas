import React from 'react';
import { personalEntrega, personalRecibe } from '../personnel';

interface SignatureFieldsProps {
    entregadoPorId: string;
    recibidoPorId: string;
    onEntregadoChange: (value: string) => void;
    onRecibidoChange: (value: string) => void;
}

const SignatureFields: React.FC<SignatureFieldsProps> = ({
    entregadoPorId, recibidoPorId, onEntregadoChange, onRecibidoChange
}) => (
    <footer className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="entregadoPor" className="block text-sm font-semibold text-slate-600 mb-2">Entregado por</label>
            <select
                id="entregadoPor"
                value={entregadoPorId}
                onChange={e => onEntregadoChange(e.target.value)}
                className="block w-full rounded-xl border-0 p-3 bg-slate-100/70 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
            >
                <option value="">Seleccione quién entrega...</option>
                {personalEntrega.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
            </select>
        </div>
        <div>
            <label htmlFor="recibidoPor" className="block text-sm font-semibold text-slate-600 mb-2">Recibido por</label>
            <select
                id="recibidoPor"
                value={recibidoPorId}
                onChange={e => onRecibidoChange(e.target.value)}
                className="block w-full rounded-xl border-0 p-3 bg-slate-100/70 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
            >
                <option value="">Seleccione quién recibe...</option>
                {personalRecibe.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
            </select>
        </div>
    </footer>
);

export default SignatureFields;
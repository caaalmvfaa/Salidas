import React from 'react';

interface MetadataFormProps {
    fecha: string;
    servicio: string;
    onFechaChange: (value: string) => void;
    onServicioChange: (value: string) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ fecha, servicio, onFechaChange, onServicioChange }) => (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
            <label htmlFor="fecha" className="block text-sm font-semibold text-slate-600 mb-2">Fecha del Pedido</label>
            <input
                id="fecha"
                type="date"
                value={fecha}
                onChange={e => onFechaChange(e.target.value)}
                className="block w-full rounded-xl border-0 p-3 bg-slate-100/70 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
            />
        </div>
        <div>
            <label htmlFor="servicio" className="block text-sm font-semibold text-slate-600 mb-2">Área de Servicio</label>
            <select
                id="servicio"
                value={servicio}
                onChange={e => onServicioChange(e.target.value)}
                className="block w-full rounded-xl border-0 p-3 bg-slate-100/70 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
            >
                <option value="Comedor">Comedor</option>
                <option value="Pacientes">Pacientes</option>
                <option value="Nutrición Clínica">Nutrición Clínica</option>
                <option value="Extras">Extras</option>
                <option value="Dietologia">Dietologia</option>
            </select>
        </div>
    </section>
);

export default MetadataForm;
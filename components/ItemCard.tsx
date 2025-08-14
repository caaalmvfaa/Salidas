import React from 'react';
import { Item, Articulo } from '../types';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ItemCardProps {
    item: Item;
    articulos: Articulo[];
    isExpanded: boolean;
    onExpand: () => void;
    onCollapse: () => void;
    onItemChange: (id: string, field: keyof Item, value: string) => void;
    onArticleChange: (id: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
    onDeleteItem: (id: string) => void;
    isDeletable: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
    item, articulos, isExpanded, onExpand, onCollapse, onItemChange, onArticleChange, onDeleteItem, isDeletable
}) => {
    if (!isExpanded) {
        return (
            <div
                onClick={onExpand}
                className="p-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-indigo-500/80 cursor-pointer relative transition-all duration-300 group"
                role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onExpand()}
            >
                {isDeletable && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-transform transform hover:scale-110 opacity-0 group-hover:opacity-100"
                        aria-label="Eliminar artículo"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                )}
                <div className="flex justify-between items-center">
                    <div className="flex-grow min-w-0 pr-4">
                        <p className="font-semibold text-slate-800 truncate">{item.descripcion || <span className="text-slate-400">Artículo sin seleccionar</span>}</p>
                        <p className="text-sm text-slate-500">Cantidad: {item.cantidadPedida || 'N/A'}</p>
                    </div>
                    <div className="flex-shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <ChevronDownIcon className="h-6 w-6 transition-transform duration-300" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 ring-2 ring-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/10 bg-white/90 backdrop-blur-sm relative transition-all duration-300">
            {isDeletable && (
                <button
                    onClick={() => onDeleteItem(item.id)}
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-transform transform hover:scale-110"
                    aria-label="Eliminar artículo"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-2">
                    <label htmlFor={`descripcion-${item.id}`} className="block text-sm font-medium text-slate-500 mb-1">Descripción del Artículo</label>
                    <select
                        id={`descripcion-${item.id}`}
                        value={item.descripcion}
                        onChange={(e) => onArticleChange(item.id, e)}
                        className="block w-full rounded-md border-0 py-2 px-3 bg-slate-100/50 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
                        aria-label="Seleccione un artículo"
                    >
                        {articulos.map(art => (
                            <option key={art.Codigo || `default-${item.id}`} value={art.Articulo}>{art.Articulo}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor={`cantidadPedida-${item.id}`} className="block text-sm font-medium text-slate-500 mb-1">Cantidad</label>
                    <input
                        id={`cantidadPedida-${item.id}`}
                        type="number"
                        value={item.cantidadPedida}
                        onChange={e => onItemChange(item.id, 'cantidadPedida', e.target.value)}
                        className="block w-full rounded-md border-0 py-2 px-3 bg-slate-100/50 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition"
                        placeholder="Ej. 10"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={onCollapse} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Cerrar
                </button>
            </div>
        </div>
    );
};
export default ItemCard;
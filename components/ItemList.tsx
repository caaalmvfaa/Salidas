import React from 'react';
import { Item, Articulo } from '../types';
import ItemCard from './ItemCard';
import PlusIcon from './icons/PlusIcon';

interface ItemListProps {
    items: Item[];
    articulos: Articulo[];
    expandedItemId: string | null;
    setExpandedItemId: (id: string | null) => void;
    onItemChange: (id: string, field: keyof Item, value: string) => void;
    onArticleChange: (id: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
    onAddItem: () => void;
    onDeleteItem: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({
    items, articulos, expandedItemId, setExpandedItemId, onAddItem, onDeleteItem, onItemChange, onArticleChange
}) => (
    <section className="mt-8 border-t border-slate-200 pt-8">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Lista de Artículos</h3>
            <button
                onClick={onAddItem}
                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg hover:bg-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                Agregar
            </button>
        </div>

        {items.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                <p className="text-slate-500">No hay artículos en el pedido.</p>
                <p className="text-slate-400 text-sm mt-1">Haga clic en "Agregar" para empezar.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {items.map((item) => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        articulos={articulos}
                        isExpanded={item.id === expandedItemId}
                        onExpand={() => setExpandedItemId(item.id)}
                        onCollapse={() => setExpandedItemId(null)}
                        onDeleteItem={onDeleteItem}
                        isDeletable={items.length > 1}
                        onItemChange={onItemChange}
                        onArticleChange={onArticleChange}
                    />
                ))}
            </div>
        )}
    </section>
);

export default ItemList;
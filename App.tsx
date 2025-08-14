import React, { useState, useEffect, useCallback } from 'react';
import { Item, Articulo, Person } from './types';
import { personnel } from './personnel';
import { convertirNumeroALetras } from './numberToWords';
import PrinterIcon from './components/icons/PrinterIcon';
import PlusIcon from './components/icons/PlusIcon';
import TrashIcon from './components/icons/TrashIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';

declare const jspdf: any;

const App: React.FC = () => {
    const [partida] = useState('2212');
    const [unidad] = useState('Fray Antonio Alcalde');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [servicio, setServicio] = useState('Comedor');
    const [cuenta] = useState('2212'); // Fixed value
    const [entregadoPorId, setEntregadoPorId] = useState<string>('');
    const [recibidoPorId, setRecibidoPorId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    
    const initialItem: Item = { id: Date.now().toString(), codigo: '', descripcion: '', unidad: '', cantidadPedida: '', cantidadSurtida: '', observaciones: '' };
    const [items, setItems] = useState<Item[]>([initialItem]);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(initialItem.id);

    useEffect(() => {
        const fetchArticulos = async () => {
            try {
                const response = await fetch('/articulos.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Articulo[] = await response.json();
                const defaultOption: Articulo = { "Codigo": "", "Articulo": "Seleccione un artículo...", "Unidad Medida": "" };
                setArticulos([defaultOption, ...data]);
            } catch (error) {
                console.error("No se pudieron cargar los artículos:", error);
                alert("Error al cargar la lista de artículos. Por favor, recargue la página.");
            }
        };
        fetchArticulos();
    }, []);

    const handleItemChange = (id: string, field: keyof Item, value: string) => {
        setItems(prevItems =>
            prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleArticleChange = (id: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDescription = e.target.value;
        const selectedArticle = articulos.find(art => art.Articulo === selectedDescription);
        
        setItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    if (selectedArticle && selectedArticle.Codigo) {
                        return {
                            ...item,
                            codigo: selectedArticle.Codigo,
                            descripcion: selectedArticle.Articulo,
                            unidad: selectedArticle['Unidad Medida'],
                        };
                    } else {
                        return {
                            ...item,
                            codigo: '',
                            descripcion: '',
                            unidad: '',
                        };
                    }
                }
                return item;
            })
        );
    };

    const addItem = () => {
        const newItemId = Date.now().toString();
        const newItem: Item = {
            id: newItemId,
            codigo: '',
            descripcion: '',
            unidad: '',
            cantidadPedida: '',
            cantidadSurtida: '',
            observaciones: ''
        };
        setItems(prevItems => [...prevItems, newItem]);
        setExpandedItemId(newItemId);
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);

        if (expandedItemId === id) {
            if (newItems.length > 0) {
                setExpandedItemId(newItems[newItems.length - 1].id);
            } else {
                setExpandedItemId(null);
            }
        }
    };

    const generatePdf = useCallback(() => {
        setIsLoading(true);
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'letter'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 10;
            
            // --- Header Titles ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('HOSPITAL CIVIL DE GUADALAJARA', pageWidth / 2, 18, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PEDIDO AL ALMACEN VIVERES', pageWidth / 2, 24, { align: 'center' });

            // --- Metadata ---
            doc.setFontSize(9);
            const metaY1 = 33;
            doc.setFont('helvetica', 'bold');
            doc.text('Partida Presupuestal:', margin + 45, metaY1, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(partida, margin + 47, metaY1);
            doc.line(margin + 46, metaY1 + 1, margin + 65, metaY1 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('Unidad Hospitalaria:', margin + 140, metaY1, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(unidad, margin + 142, metaY1);
            doc.line(margin + 141, metaY1 + 1, margin + 190, metaY1 + 1);
            
            const metaY2 = 40;
            const displayDate = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
            doc.setFont('helvetica', 'bold');
            doc.text('FECHA:', margin, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(displayDate, margin + 14, metaY2);
            doc.line(margin + 13, metaY2 + 1, margin + 40, metaY2 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('SERVICIO:', margin + 70, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(servicio, margin + 88, metaY2);
            doc.line(margin + 87, metaY2 + 1, margin + 145, metaY2 + 1);
            
            doc.setFont('helvetica', 'bold');
            doc.text('CUENTA:', margin + 180, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(cuenta, margin + 197, metaY2);
            doc.line(margin + 196, metaY2 + 1, margin + 220, metaY2 + 1);

            // --- Main Table ---
            const tableColumn = [
                ["CODIGO", "DESCRIPCION DEL ARTICULO", "UNIDAD", 
                {content: 'CANTIDAD\nPEDIDA', styles: {halign: 'center'}}, 
                {content: 'CANTIDAD\nSURTIDA', styles: {halign: 'center'}}, 
                "CANTIDAD SURTIDA CON LETRA/\nOBSERVACIONES"]
            ];
            
            const tableRows = items.map(item => {
                const cantidad = Number(item.cantidadPedida);
                const cantidadValida = !isNaN(cantidad) && cantidad > 0;
                const cantidadSurtidaLetra = cantidadValida ? convertirNumeroALetras(cantidad) : '';

                return [
                    item.codigo,
                    item.descripcion,
                    item.unidad,
                    {content: item.cantidadPedida, styles: {halign: 'center'}},
                    {content: cantidadValida ? item.cantidadPedida : '', styles: {halign: 'center'}},
                    cantidadSurtidaLetra
                ];
            });

            const totalRowsOnForm = 16;
            while(tableRows.length < totalRowsOnForm){
                tableRows.push(["", "", "", "", "", ""]);
            }

            doc.autoTable({
                head: tableColumn,
                body: tableRows.slice(0, totalRowsOnForm),
                startY: 45,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 0.8,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    valign: 'middle',
                    minCellHeight: 7.2
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 7.5,
                    cellPadding: 0.5,
                },
                 columnStyles: {
                    0: { cellWidth: 22 },
                    1: { cellWidth: 88 },
                    2: { cellWidth: 15, halign: 'center' },
                    3: { cellWidth: 18, halign: 'center' },
                    4: { cellWidth: 18, halign: 'center' },
                    5: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
            });
            
            // --- Signature Table ---
            const entregadoPor = personnel.find(p => p.id === entregadoPorId);
            const recibidoPor = personnel.find(p => p.id === recibidoPorId);

            doc.autoTable({
                startY: (doc as any).autoTable.previous.finalY + 1,
                body: [
                    ['JEFE DE SERVICIO DIETOLOGÍA', 'ALMACÉN DE VÍVERES', 'ENTREGADO POR', 'RECIBIDO POR'],
                    [
                        '', 
                        '', 
                        entregadoPor ? `${entregadoPor.nombre}\nRUD: ${entregadoPor.rud}` : '', 
                        recibidoPor ? `${recibidoPor.nombre}\nRUD: ${recibidoPor.rud}` : ''
                    ],
                    ['NOMBRE Y FIRMA', 'NOMBRE Y FIRMA', 'NOMBRE Y RUD', 'NOMBRE Y RUD']
                ],
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 7,
                    halign: 'center',
                    valign: 'middle',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    cellPadding: 0.8
                },
                didParseCell: (hookData: any) => {
                    hookData.cell.styles.valign = 'middle';
                    if (hookData.row.index === 0) {
                         hookData.cell.styles.fontStyle = 'bold';
                         hookData.cell.styles.fontSize = 7.5;
                    }
                     if (hookData.row.index === 1) { 
                        hookData.cell.styles.minCellHeight = 15;
                        hookData.cell.styles.fontSize = 7;
                        hookData.cell.styles.valign = 'top';
                        hookData.cell.styles.cellPadding = { top: 1 };
                    }
                    if (hookData.row.index === 2) { 
                        hookData.cell.styles.fontStyle = 'bold';
                        hookData.cell.styles.fontSize = 7.5;
                    }
                },
                margin: { left: margin, right: margin },
            });

            doc.output('dataurlnewwindow');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
        } finally {
            setIsLoading(false);
        }
    }, [partida, unidad, fecha, servicio, cuenta, items, entregadoPorId, recibidoPorId]);


    return (
        <div className="container mx-auto p-4 sm:p-8 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-7xl mx-auto">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-6 border-gray-200 gap-4">
                    <div>
                         <h1 className="text-xl sm:text-2xl font-bold text-gray-800">HOSPITAL CIVIL DE GUADALAJARA</h1>
                         <h2 className="text-lg sm:text-xl font-semibold text-gray-600">PEDIDO AL ALMACEN VIVERES</h2>
                    </div>
                    <button
                        onClick={generatePdf}
                        disabled={isLoading || items.length === 0 || items.every(item => !item.descripcion || item.descripcion === "Seleccione un artículo...")}
                        className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        {isLoading ? 'Generando...' : 'Generar PDF para Imprimir'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            id="fecha"
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>
                    <div>
                        <label htmlFor="servicio" className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                        <select
                            id="servicio"
                            value={servicio}
                            onChange={e => setServicio(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                             <option value="Comedor">Comedor</option>
                            <option value="Pacientes">Pacientes</option>
                            <option value="Nutrición Clínica">Nutrición Clínica</option>
                            <option value="Extras">Extras</option>
                            <option value="Dietologia">Dietologia</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 border-t pt-6 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Detalles de los Artículos</h3>
                         <button onClick={addItem} className="flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors">
                            <PlusIcon className="h-5 w-5" />
                            Agregar Artículo
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => {
                            const isExpanded = item.id === expandedItemId;
                            if (isExpanded) {
                                return (
                                    <div key={item.id} className="p-4 border-2 border-blue-500 rounded-lg shadow-lg bg-gray-50/50 relative transition-all duration-300">
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                aria-label="Eliminar artículo"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <div className="md:col-span-2">
                                                <label htmlFor={`descripcion-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Descripción del Artículo</label>
                                                <select
                                                    id={`descripcion-${item.id}`}
                                                    value={item.descripcion}
                                                    onChange={(e) => handleArticleChange(item.id, e)}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    aria-label="Seleccione un artículo"
                                                >
                                                    {articulos.map(art => (
                                                        <option key={art.Codigo || `default-${item.id}`} value={art.Articulo}>{art.Articulo}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor={`cantidadPedida-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Cantidad Pedida</label>
                                                <input
                                                    id={`cantidadPedida-${item.id}`}
                                                    type="number"
                                                    value={item.cantidadPedida}
                                                    onChange={e => handleItemChange(item.id, 'cantidadPedida', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400"
                                                    placeholder="Ej. 10"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`codigo-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                                <input id={`codigo-${item.id}`} type="text" value={item.codigo} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-gray-900" />
                                            </div>
                                            <div>
                                                <label htmlFor={`unidad-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                                                <input id={`unidad-${item.id}`} type="text" value={item.unidad} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-gray-900" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={item.id} onClick={() => setExpandedItemId(item.id)} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer relative transition-all duration-300">
                                        {items.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteItem(item.id);
                                                }}
                                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                aria-label="Eliminar artículo"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex-grow min-w-0 pr-4">
                                                <p className="font-semibold text-gray-800 truncate">{item.descripcion || 'Artículo sin seleccionar'}</p>
                                                <p className="text-sm text-gray-500">Cantidad: {item.cantidadPedida || 'N/A'}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>

                 <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="entregadoPor" className="block text-sm font-medium text-gray-700 mb-1">Entregado por</label>
                        <select
                            id="entregadoPor"
                            value={entregadoPorId}
                            onChange={e => setEntregadoPorId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">Seleccione quién entrega...</option>
                            {personnel.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="recibidoPor" className="block text-sm font-medium text-gray-700 mb-1">Recibido por</label>
                        <select
                            id="recibidoPor"
                            value={recibidoPorId}
                            onChange={e => setRecibidoPorId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">Seleccione quién recibe...</option>
                             {personnel.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default App;
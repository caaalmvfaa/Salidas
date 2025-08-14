import React, { useState, useEffect, useCallback } from 'react';
import { Item, Articulo } from './types';
import { personalEntrega, personalRecibe } from './personnel';
import { convertirNumeroALetras } from './numberToWords';
import PrinterIcon from './components/icons/PrinterIcon';
import PlusIcon from './components/icons/PlusIcon';
import TrashIcon from './components/icons/TrashIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import HospitalIcon from './components/icons/HospitalIcon';

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
                    minCellHeight: 7.0
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
            const entregadoPor = personalEntrega.find(p => p.id === entregadoPorId);
            const recibidoPor = personalRecibe.find(p => p.id === recibidoPorId);

            doc.autoTable({
                startY: (doc as any).autoTable.previous.finalY + 3,
                body: [
                    ['JEFE DE SERVICIO DIETOLOGÍA', 'ALMACÉN DE VÍVERES', 'ENTREGADO POR', 'RECIBIDO POR'],
                    [
                        'KARLA MABEL GUTIÉRREZ VELASCO\nRUD: 980395', 
                        'OSCAR BECERRA GONZÁLEZ\nRUD: 980933', 
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
                    if (hookData.row.index === 0 || hookData.row.index === 2) {
                         hookData.cell.styles.fontStyle = 'bold';
                         hookData.cell.styles.fontSize = 7.5;
                    }
                     if (hookData.row.index === 1) { 
                        hookData.cell.styles.minCellHeight = 14;
                        hookData.cell.styles.fontSize = 7;
                        hookData.cell.styles.valign = 'middle';
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
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <div className="bg-slate-50 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-6xl mx-auto">

                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <HospitalIcon className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">HOSPITAL CIVIL DE GUADALAJARA</h1>
                            <p className="text-lg font-medium text-slate-500">Pedido al Almacén de Víveres</p>
                        </div>
                    </div>
                    <button
                        onClick={generatePdf}
                        disabled={isLoading || items.length === 0 || items.every(item => !item.descripcion || item.descripcion === "Seleccione un artículo...")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        {isLoading ? 'Generando...' : 'Generar PDF'}
                    </button>
                </header>

                <main>
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label htmlFor="fecha" className="block text-sm font-semibold text-slate-700 mb-2">Fecha del Pedido</label>
                            <input
                                id="fecha"
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                className="block w-full rounded-xl border-0 p-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="servicio" className="block text-sm font-semibold text-slate-700 mb-2">Área de Servicio</label>
                            <select
                                id="servicio"
                                value={servicio}
                                onChange={e => setServicio(e.target.value)}
                                className="block w-full rounded-xl border-0 p-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                            >
                                <option value="Comedor">Comedor</option>
                                <option value="Pacientes">Pacientes</option>
                                <option value="Nutrición Clínica">Nutrición Clínica</option>
                                <option value="Extras">Extras</option>
                                <option value="Dietologia">Dietologia</option>
                            </select>
                        </div>
                    </section>

                    <section className="mt-8 border-t border-slate-200 pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Lista de Artículos</h3>
                            <button 
                                onClick={addItem} 
                                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg hover:bg-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Agregar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => {
                                const isExpanded = item.id === expandedItemId;
                                if (isExpanded) {
                                    return (
                                        <div key={item.id} className="p-5 ring-2 ring-indigo-500 rounded-2xl shadow-lg bg-white relative transition-all duration-300">
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition"
                                                    aria-label="Eliminar artículo"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                                <div className="sm:col-span-2">
                                                    <label htmlFor={`descripcion-${item.id}`} className="block text-sm font-medium text-slate-600 mb-1">Descripción del Artículo</label>
                                                    <select
                                                        id={`descripcion-${item.id}`}
                                                        value={item.descripcion}
                                                        onChange={(e) => handleArticleChange(item.id, e)}
                                                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                                                        aria-label="Seleccione un artículo"
                                                    >
                                                        {articulos.map(art => (
                                                            <option key={art.Codigo || `default-${item.id}`} value={art.Articulo}>{art.Articulo}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor={`cantidadPedida-${item.id}`} className="block text-sm font-medium text-slate-600 mb-1">Cantidad</label>
                                                    <input
                                                        id={`cantidadPedida-${item.id}`}
                                                        type="number"
                                                        value={item.cantidadPedida}
                                                        onChange={e => handleItemChange(item.id, 'cantidadPedida', e.target.value)}
                                                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                                                        placeholder="Ej. 10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={item.id} onClick={() => setExpandedItemId(item.id)} className="p-4 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 hover:border-indigo-400 cursor-pointer relative transition-all duration-300 group">
                                            {items.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteItem(item.id);
                                                    }}
                                                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition opacity-0 group-hover:opacity-100"
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
                                                <div className="flex-shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                    <ChevronDownIcon className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </section>

                    <footer className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="entregadoPor" className="block text-sm font-semibold text-slate-700 mb-2">Entregado por</label>
                            <select
                                id="entregadoPor"
                                value={entregadoPorId}
                                onChange={e => setEntregadoPorId(e.target.value)}
                                className="block w-full rounded-xl border-0 p-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                            >
                                <option value="">Seleccione quién entrega...</option>
                                {personalEntrega.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="recibidoPor" className="block text-sm font-semibold text-slate-700 mb-2">Recibido por</label>
                            <select
                                id="recibidoPor"
                                value={recibidoPorId}
                                onChange={e => setRecibidoPorId(e.target.value)}
                                className="block w-full rounded-xl border-0 p-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition"
                            >
                                <option value="">Seleccione quién recibe...</option>
                                {personalRecibe.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default App;
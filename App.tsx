
import React, { useState, useEffect, useCallback } from 'react';
import { Item, Articulo } from './types';
import HospitalIcon from './components/icons/HospitalIcon';
import PrinterIcon from './components/icons/PrinterIcon';
import PlusIcon from './components/icons/PlusIcon';
import TrashIcon from './components/icons/TrashIcon';

declare const jspdf: any;

const App: React.FC = () => {
    const [partida] = useState('2212');
    const [unidad] = useState('Fray Antonio Alcalde');
    const [fecha] = useState(new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    const [servicio, setServicio] = useState('Pacientes');
    const [cuenta] = useState('2212'); // Fixed value
    const [recibidoPor, setRecibidoPor] = useState('');
    const [nombreRud, setNombreRud] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    
    const initialItem: Item = { id: Date.now().toString(), codigo: '', descripcion: '', unidad: '', cantidadPedida: '', cantidadSurtida: '', observaciones: '' };
    const [items, setItems] = useState<Item[]>([initialItem]);

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
        setItems(prevItems => [...prevItems, { ...initialItem, id: Date.now().toString() }]);
    };

    const deleteItem = (id: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
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
            const margin = 15;

            const drawLogoBox = (x: number) => {
                const y = 8;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.rect(x, y, 20, 20);
                doc.text('HC', x + 10, y + 8, { align: 'center' });
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(6)
                doc.text('PIENSA Y TRABAJA', x + 10, y + 15, { align: 'center' });
                doc.setFont('helvetica', 'normal');
            };

            drawLogoBox(margin);
            drawLogoBox(pageWidth - margin - 20);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('HOSPITAL CIVIL DE GUADALAJARA', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PEDIDO AL ALMACEN VIVERES', pageWidth / 2, 22, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            const metaY1 = 33;
            const metaY2 = 43;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Partida Presupuestal:', 40, metaY1);
            doc.setFont('helvetica', 'normal');
            doc.text(partida, 78, metaY1);
            doc.line(77, metaY1 + 1, 105, metaY1 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('Unidad Hospitalaria:', 115, metaY1);
            doc.setFont('helvetica', 'normal');
            doc.text(unidad, 150, metaY1);
            doc.line(149, metaY1 + 1, 210, metaY1 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('FECHA:', margin, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(fecha, margin + 15, metaY2);
            doc.line(margin + 14, metaY2 + 1, margin + 45, metaY2 + 1);
            
            doc.setFont('helvetica', 'bold');
            doc.text('SERVICIO:', 80, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(servicio, 100, metaY2);
            doc.line(99, metaY2 + 1, 160, metaY2 + 1);
            
            doc.setFont('helvetica', 'bold');
            doc.text('CUENTA:', 180, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(cuenta, 198, metaY2);
            doc.line(197, metaY2 + 1, 230, metaY2 + 1);

            const tableColumn = [
                ["CODIGO", "DESCRIPCION DEL ARTICULO", "UNIDAD", 
                {content: 'CANTIDAD\nPEDIDA', styles: {halign: 'center'}}, 
                {content: 'CANTIDAD\nSURTIDA', styles: {halign: 'center'}}, 
                "CANTIDAD SURTIDA CON LETRA/\nOBSERVACIONES"]
            ];
            const tableRows = items.map(item => [
                item.codigo,
                item.descripcion,
                item.unidad,
                {content: item.cantidadPedida, styles: {halign: 'center'}},
                {content: item.cantidadSurtida, styles: {halign: 'center'}},
                item.observaciones
            ]);

            const totalRowsOnForm = 16;
            while(tableRows.length < totalRowsOnForm){
                tableRows.push(["", "", "", "", "", ""]);
            }

            doc.autoTable({
                head: tableColumn,
                body: tableRows,
                startY: 50,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 1.5,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    valign: 'middle',
                    minCellHeight: 7.5
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 7
                },
                 columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 88 },
                    2: { cellWidth: 15, halign: 'center' },
                    3: { cellWidth: 22, halign: 'center' },
                    4: { cellWidth: 22, halign: 'center' },
                    5: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
                didDrawPage: (data: any) => {
                    const footerStartY = 185;
                    const footerHeight = 25;
                    const footerWidth = pageWidth - 2 * margin;
            
                    doc.setLineWidth(0.5);
                    doc.rect(margin, footerStartY, footerWidth, footerHeight);
            
                    const colWidths = [
                        footerWidth * 0.3, 
                        footerWidth * 0.25,
                        footerWidth * 0.225,
                        footerWidth * 0.225,
                    ];
                    
                    doc.line(margin + colWidths[0], footerStartY, margin + colWidths[0], footerStartY + footerHeight);
                    doc.line(margin + colWidths[0] + colWidths[1], footerStartY, margin + colWidths[0] + colWidths[1], footerStartY + footerHeight);
                    doc.line(margin + colWidths[0] + colWidths[1] + colWidths[2], footerStartY, margin + colWidths[0] + colWidths[1] + colWidths[2], footerStartY + footerHeight);
            
                    const midY = footerStartY + footerHeight / 2;
                    doc.line(margin, midY, pageWidth - margin, midY);
            
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    const textY1 = footerStartY + 6;
                    const textY2 = midY + 6;
            
                    let x1 = margin + colWidths[0] / 2;
                    doc.text('JEFE DE SERVICIO DIETOLOGÍA', x1, textY1, { align: 'center' });
                    doc.text('NOMBRE Y FIRMA', x1, textY2, { align: 'center' });
            
                    let x2 = margin + colWidths[0] + colWidths[1] / 2;
                    doc.text('ALMACÉN DE VÍVERES', x2, textY1, { align: 'center' });
                    doc.text('NOMBRE Y FIRMA', x2, textY2, { align: 'center' });
                    
                    let x3 = margin + colWidths[0] + colWidths[1] + colWidths[2] / 2;
                    doc.text('ENTREGADO POR', x3, textY1, { align: 'center' });
                    doc.text('NOMBRE Y RUD', x3, textY2, { align: 'center' });
                    
                    let x4 = margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2;
                    doc.text('RECIBIDO POR', x4, textY1, { align: 'center' });
                    doc.text('NOMBRE Y RUD', x4, textY2, { align: 'center' });
            
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    doc.text(nombreRud, margin + 2, midY + 10); 
            
                    const recibidoX = margin + colWidths[0] + colWidths[1] + colWidths[2] + 2;
                    doc.text(recibidoPor, recibidoX, midY + 10);
                },
            });

            doc.output('dataurlnewwindow');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
        } finally {
            setIsLoading(false);
        }
    }, [partida, unidad, fecha, servicio, cuenta, nombreRud, recibidoPor, items]);


    return (
        <div className="container mx-auto p-4 sm:p-8 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-7xl mx-auto">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-6 border-gray-200 gap-4">
                    <div className="flex items-center gap-4">
                        <HospitalIcon className="h-12 w-12 text-red-900 flex-shrink-0" />
                        <div>
                             <h1 className="text-xl sm:text-2xl font-bold text-gray-800">HOSPITAL CIVIL DE GUADALAJARA</h1>
                             <h2 className="text-lg sm:text-xl font-semibold text-gray-600">PEDIDO AL ALMACEN VIVERES</h2>
                        </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partida Presupuestal</label>
                        <input type="text" value={partida} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Hospitalaria</label>
                        <input type="text" value={unidad} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input type="text" value={fecha} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label htmlFor="servicio" className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                        <select
                            id="servicio"
                            value={servicio}
                            onChange={e => setServicio(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Pacientes">Pacientes</option>
                            <option value="Comedor">Comedor</option>
                            <option value="Nutrición Clínica">Nutrición Clínica</option>
                            <option value="Extras">Extras</option>
                            <option value="Dietologia">Dietologia</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                        <input type="text" value={cuenta} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
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

                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50/50 relative">
                                {items.length > 1 && (
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                        aria-label="Eliminar artículo"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                    <div className="lg:col-span-2">
                                        <label htmlFor={`descripcion-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Descripción del Artículo</label>
                                        <select
                                            id={`descripcion-${item.id}`}
                                            value={item.descripcion}
                                            onChange={(e) => handleArticleChange(item.id, e)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej. 10"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`codigo-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                        <input id={`codigo-${item.id}`} type="text" value={item.codigo} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label htmlFor={`unidad-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                                        <input id={`unidad-${item.id}`} type="text" value={item.unidad} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label htmlFor={`cantidadSurtida-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Cantidad Surtida</label>
                                        <input id={`cantidadSurtida-${item.id}`} type="text" value={item.cantidadSurtida} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" placeholder="(Llenado por almacén)" />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label htmlFor={`observaciones-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Cantidad Surtida con Letra / Observaciones</label>
                                        <input
                                            id={`observaciones-${item.id}`}
                                            type="text"
                                            value={item.observaciones}
                                            onChange={e => handleItemChange(item.id, 'observaciones', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Escribir cantidad con letra u otras notas"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y RUD (Quien solicita)</label>
                        <input type="text" value={nombreRud} onChange={e => setNombreRud(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Firma y datos de quien solicita"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recibido por (Almacén)</label>
                        <input type="text" value={recibidoPor} onChange={e => setRecibidoPor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Firma de quien recibe en almacén"/>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default App;

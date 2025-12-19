import query from "./Database.mjs";
import map_json from "./Coordenadas.mjs";

const campos = [
    {codigo: "a", texto: "Gênero Principal"},
    {codigo: "b", texto: "Faixa de Avaliação da Crítica"},
    {codigo: "c", texto: "Sentimento dos Usuários"},
    {codigo: "d", texto: "Desenvolvedora"},
    {codigo: "e", texto: "Época de Lançamento"},
    {codigo: "f", texto: "Plataformas Disponíveis"},
    {codigo: "g", texto: "Classificação Etária"},
    {codigo: "h", texto: "Modo de Jogo"},
    {codigo: "i", texto: "Status de Servidor"},
    {codigo: "j", texto: "Faixa de Preço"},
    {codigo: "k", texto: "Categoria de Tamanho"}
];

campos.forEach(e => e.texto = e.texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase());
map_json.features.forEach(e => e.id = e.name = e.properties.name = e.properties.id = e.id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase());

const localidades =  query(`select distinct a from idosos`, "array").flat().toSorted((a, b) => a.localeCompare(b));

const ID = {selectFilter: 0, selectGraphics: 0, selectWhere: 0};

function createGraphic(type, name, countings, xAxis)
{	const main = document.querySelector("main");
	const div = document.createElement("div");
	div.setAttribute("id", `chart${document.querySelectorAll("main > div").length}`);
	main.appendChild(div);

	let tmp = countings.reduce((accumulator, element) => 
	{   const group = element.slice(0, element.length-2).join(", ");
		if (!accumulator[group])
			accumulator[group] = [];

		accumulator[group].push(element);
		return(accumulator);
	}, {});

	for (let key in tmp)    
		tmp[key].push(...xAxis.filter((e) => !tmp[key].map((e) => e[e.length-2]).includes(e)).map((e) => key.split(", ").concat([e, 0])));

	const series = Object.keys(tmp).reduce((accumulator, element) => 
	{	accumulator.push({ "name": element, "data": tmp[element].toSorted((a, b) => a[a.length-2].localeCompare(b[b.length-2])).map((e) => e[e.length-1])});
		return accumulator;
	}, []);
	
	newGraphic(type, div.id, name, xAxis, series);
}

function setGraphics()
{   document.querySelector("main").innerHTML = "";
    
	//filterGraphic
	const columns = Array.from(document.querySelectorAll(".selectFilter")).map((e) => e.value).join(",");
	var filtersWhere = Array.from(document.querySelectorAll(".selectWhere.Fltrs")).filter(where => where.selectedOptions.length).map(where => where.value+" in ("+Array.from(where.selectedOptions, option => "'"+option.innerHTML+"'")+")").join(" and ");
	(filtersWhere != "") && (filtersWhere = `where ${filtersWhere}`);
	const countings = query(`select ${columns}, count(*) from idosos ${filtersWhere} group by ${columns}`, "array");
	
	const finalCamp = Array.from(document.querySelectorAll(".selectWhere.Fltrs")[document.querySelectorAll(".selectWhere.Fltrs").length-1].selectedOptions, e => e.innerHTML);
	const xAxis = (finalCamp.length ? finalCamp : query(`select distinct ${columns.split(",")[columns.split(",").length-1]} from idosos`, "array")).flat().toSorted((a, b) => a.localeCompare(b));        
	
	createGraphic(1, Array.from(document.querySelectorAll(".selectFilter")).map((e) => e.options[e.selectedIndex].innerText).join(' X '), countings, xAxis);

	for (let graphic of Array.from(document.querySelectorAll(".selectGraphics"))) 
    {   const type = graphic.parentElement.querySelector('input[type="radio"]:checked').value;
		
		const columns = Array.from(document.querySelectorAll(".selectFilter")).map((e) => e.value).join(",") + "," + graphic.value;
        let graphicWhere = Array.from(document.querySelector(`#${graphic.id}.selectWhere.Grphcs`).selectedOptions, op => "'"+op.innerHTML+"'");
        
        const xAxis = (graphicWhere.length ? graphicWhere.map(e => e.slice(1, e.length-1)) : query(`select distinct ${graphic.value} from idosos`, "array")).flat().toSorted((a, b) => a.localeCompare(b));        
		
		graphicWhere = graphicWhere.length ? `where ${graphic.value} in (${graphicWhere})` : '';
		const countings = query(`select ${columns}, count(*) from (select * from idosos ${graphicWhere}) ${filtersWhere} group by ${columns}`, "array");
        
		createGraphic(type, graphic.options[graphic.selectedIndex].innerHTML, countings, xAxis);
    }
}

function newGraphic(type,id,name,xAxis,series){
	let legenda_text = "Mostrar Legenda";
	let empil_text = "Empilhar Colunas";
	let col_dir = "Coluna Horizontal";
	let csv = '"Categoria";';
	csv += series.map(item => `"${item.name}"`).join(';') + '\n';

	xAxis.forEach((categoria, index) => {
		csv += `"${categoria}";`;
		csv += series.map(item => item.data[index]).join(';') + '\n';
	});

	switch (+(type)) {
  case 1: //Gráfico em Barras|Colunas
  ((series[0].name) && (series.sort((a,b) => b.data.reduce((a,v) => a+v, 0) - a.data.reduce((a,v) => a+v, 0)))) ||   xAxis.sort((a,b) => series[0].data[xAxis.indexOf(b)] - series[0].data[xAxis.indexOf(a)]) && series[0].data.sort((a,b) => b-a);
		H_U.chart(id, {
			chart: {
				type: 'column',
				csv_backup: csv,

				scrollablePlotArea: {
					minWidth: 0, //series.length * 20 * xAxis.length,   
					scrollPositionX: 0
				},
			},
			title: {
				text: name
			},

			xAxis: {
				categories: xAxis,
				title: {
					text: null
				},
				scrollbar: {
					enabled: true
				},
				min: 0,
				max: xAxis.length - 1

			},
			plotOptions: {
				series: {
					stacking: false,
				}
			},
			yAxis: {
				min: 0,
				title: {
					text: 'quantidade'
				},
				labels: {
					overflow: 'justify'
				}
			},
			legend: {
				enabled: false
			},
			back_e: false,
			series: series,
			exporting: {
				buttons: {
					contextButton: {
						symbol: 'menu',
						floating: false,
						theme: {
							fill: '#ffffff',
							'stroke-width': 1,
							stroke: 'silver',
							r: 4,
							style: {
								color: '#000000ff'
							},
							states: {
								hover: {
									fill: '#f0f0f0'
								},
								select: {
									fill: '#e0e0e0c5'
								}
							},
						},
						menuItems: [
							{
								text: 'Tela Cheia',
								onclick: function() {
									this.fullscreen?.toggle();
								},
				},
							{
								text: legenda_text,
								onclick: function() {
									if(series[0].name){
										//console.log(this.options.csv_backup)
									legenda_text = this.options.legend.enabled ? "Mostrar  Legendas" : "Esconder Legendas";
									this.exporting.divElements[1].innerText = legenda_text;
									this.update({
										legend: {
											enabled: !(this.options.legend.enabled)
										},
									}, true ,true);

									}
								},
					},
							{
								text: col_dir,
								onclick: function() {
									let nt = "";
									this.options.chart.type == "column" ? nt = "bar" : nt = "column";
									col_dir = this.options.chart.type == "column" ? "Coluna Vertical" : "Coluna Horizontal";
									this.exporting.divElements[2].innerText = col_dir;
									if(col_dir=="Coluna Vertical" && this.options.chart.scrollablePlotArea.minWidth > 1){
									const cfg = this.options.exporting.buttons.contextButton;
									this.update({
										chart: {
												type: nt,
												scrollablePlotArea: {
												minWidth: 1,
												scrollPositionX: 0
											},
										},
										exporting: {
											buttons: {
												contextButton: {
													x: 1,
													theme: cfg.theme,
													menuItems: cfg.menuItems,
												}
											}
										}
									}, true, true);

									}
								    else{
										this.update({
										chart: {
											type: nt
										},
									}, true, true);
									}
								}
					},
							{
								text: empil_text,
								onclick: function() {
									if(series[0].name){
									empil_text = this.options.plotOptions.series.stacking ? "Empilhar Colunas" : "Desempilhar Colunas";
									this.exporting.divElements[3].innerText = empil_text;
									this.update({
										plotOptions: {
											series: {
												stacking: !this.options.plotOptions.series.stacking
											}
										}
									});
									}
								}
          },
							{
								text: "Barra de Navegacao",

								onclick: function() {
									if(series[0].name && this.exporting.divElements[2].innerText == "Coluna Horizontal"){
									let nv = (this.options.chart.scrollablePlotArea.minWidth > 1) ? 1 : series.length * 20 * xAxis.length;
									//let menu_pos = (this.options.chart.scrollablePlotArea.minWidth > 1) ?  0 : -100;
									//document.querySelector(`#${id} .H_L-button-box`).style.display = 'none';
									const cfg = this.options.exporting.buttons.contextButton;
									this.update({
										chart: {
											scrollablePlotArea: {
												minWidth: nv,
												scrollPositionX: 0
											},
										},

										exporting: {
											buttons: {
												contextButton: {
													x: 1,
													theme: cfg.theme,
													menuItems: cfg.menuItems,
												}
											}
										}
									}, true, true);

								}
								}
          },
			'separator',
							{
								text: 'Imprimir',
								onclick: function() {
									this.exporting?.print();
								},
          },
							{
								text: 'Baixar PNG',
								onclick: function() {
									this.exporting?.exportChart();
								},
          },
							{
								text: 'Baixar CSV',
								onclick: function() {
									this.exporting?.downloadCSV();
								},
          },
        ]
					}
				}
			},
		});
    break;
  case 2: //Gráfico Sunburst 
		const centro_id = 'centro';
		let data = [];

		const cor_level_1 = [];
		xAxis.forEach((_, i) => {
			const cor = (i * 360 / xAxis.length) % 360;
			cor_level_1.push(`hsl(${cor}, 70%, 50%)`);
			//console.log(cor)
		});

		const baseColors = H_U.getOptions().colors;

		let colorMap = {};

		data.push({
			id: centro_id,
			parent: '',
			name: name
		});

		xAxis.forEach((categoria, i) => {
			data.push({
				id: `categoria_${i}`,
				parent: centro_id,
				name: categoria,
				color: cor_level_1[i]
			});
		});

		const agrupados_cat = {};

		series.forEach((e, ind) => {
			const baseColor = baseColors[ind % baseColors.length];
			colorMap[e.name] = baseColor;

			e.data.forEach((count, cat_ind) => {
				if(!agrupados_cat[cat_ind]) agrupados_cat[cat_ind] = [];
				agrupados_cat[cat_ind].push({
					serie: e.name,
					value: count,
					ind,
					cat_ind
				});
			});
		});

		//console.log(agrupados_cat)
		const limite = 10;

		Object.keys(agrupados_cat).forEach(cat_ind => {
			let items = agrupados_cat[cat_ind];

			let items_pequenos = [];
			let items_normais = [];

			const outros_nv = 1;

			items.forEach(({
				serie,
				value,
				ind
			}) => {
				if(value <= outros_nv) {
					(value != 0) && items_pequenos.push({
						serie,
						value,
						ind
					});
				} else {
					items_normais.push({
						serie,
						value,
						ind
					});
				}
			});

			items_normais.forEach(({
				serie,
				value,
				ind
			}) => {
				const baseColor = baseColors[ind % baseColors.length];
				const variation = Math.min((cat_ind - (xAxis.length / 10)) * 0.02, .1);
				data.push({
					id: `categoria_${cat_ind}_g${ind}`,
					parent: `categoria_${cat_ind}`,
					name: serie,
					value,
					color: H_U.color(baseColor).brighten(variation).get()
				});
			});

			let precisa_outros = false;

			Array.from({length:outros_nv}, (_,i) => ++i).forEach(n => {
				const count_n = items_pequenos.filter(it => it.value == n).length;
				if(count_n > (limite ** n)) {
					precisa_outros = true;
				}
			});

			if(precisa_outros) {
				const totalSmall = items_pequenos.reduce((sum, it) => sum + it.value, 0);
				data.push({
					id: `categoria_${cat_ind}_outros`,
					parent: `categoria_${cat_ind}`,
					name: "Outros",
					value: totalSmall,
					color: "#ccc"
				});
			} else {
				items_pequenos.forEach(({
					serie,
					value,
					ind
				}) => {
					const baseColor = baseColors[ind % baseColors.length];
					const variation = (cat_ind - (xAxis.length / 2)) * 0.05;
					data.push({
						id: `categoria_${cat_ind}_small_g${ind}`,
						parent: `categoria_${cat_ind}`,
						name: serie,
						value,
						color: H_U.color(baseColor).brighten(variation).get()
					});
				});
			}
		});

		data.filter(x => x.parent == 'center').forEach(x => data[data.findIndex(z => z.id==x.id)].sum_values = data.filter(y => y.parent == x.id).reduce((a,v) => a+v.value, 0));
		data.sort((a, b) => b.sum_values -  a.sum_values).sort((a,b) => b.value - a.value);
		//console.dir(data)

		H_U.chart(id, {
			chart: {
				type: 'sunburst',
				csv_backup: csv,
			},

			title: {
				text: name
			},
			series: [{
				data,
				cursor: 'pointer',
				allowDrillToNode: true,
				levels: [
					{
						level: 1,
						levelIsConstant: false,
						colorByPoint: false,
						dataLabels: {
							style: {
								fontWeight: 'bold',
								fontSize: '16px',
								textOutline: '1px white'
							},
							color: 'black'
						}
  },
					{
						level: 2,
						colorByPoint: false,
						dataLabels: {
							style: {
								fontSize: '12px',
								textOutline: '1px white'
							},
							color: 'black'
						}
		}
		],
			}],
			tooltip: {
				headerFormat: '',
				pointFormat: '<b>{point.name}</b>: {point.value}'
			},
			exporting: {
				buttons: {
					contextButton: {
						symbol: 'menu',
						x: -36,
						y: 0,
						theme: {
							fill: '#ffffff',
							'stroke-width': 1,
							stroke: 'silver',
							r: 4,
							style: {
								color: '#000000ff'
							},
							states: {
								hover: {
									fill: '#f0f0f0'
								},
								select: {
									fill: '#e0e0e0c5'
								}
							}
						},
						menuItems: [
							{
								text: 'Tela Cheia',
								onclick: function() {
									this.fullscreen?.toggle();
								},
          },
							{
								text: 'Imprimir',
								onclick: function() {
									this.exporting?.print();
								},
          },
							{
								text: 'Baixar PNG',
								onclick: function() {
									this.exporting?.exportChart();
								},
          },
							{
								text: 'Baixar CSV',
								onclick: function() {
									this.exporting?.downloadCSV();
								},
          },
        ]
					}
				}
			},

		});
 
    break;
  case 3: //Mapa com sobreposição de rosca
		
	const sizes = new Map();
	map_json.features.forEach(x => {
		let soma = 0;
		for (let i = 0; i < x.geometry.coordinates[0].length - 1; i++) {  
		const [x1, y1] = x.geometry.coordinates[0][i];
		const [x2, y2] = x.geometry.coordinates[0][i+1];
		soma += x1 * y2 - x2 * y1;
	}
    sizes.set(x.id, Math.min(0.005, (Math.abs(soma) / 2)));
});

	series.forEach(x => x.name = x.name.split(",").map(y => y.trim()).join(","));
    const aux = Array.from(new Set((series.map((e) => e.name.split(",").filter((x) => !(localidades.some((y) => y==x)))).map((z) => z.join(',')))));
    let keys = aux.join("") ? xAxis.flatMap((e) => aux.map((x) => [e,x.split(",")].flat())) : xAxis.map((e) => [e]);

    let map_data = keys.reduce((ac, it, ind) => {
        const filt_d = series.filter((x) => it.slice(1).every(item => (x.name.split(",")).includes(item)));	

        filt_d.forEach((e) => ac[ac.findIndex((x) => x[0]== e.name.split(",").filter((x) => localidades.some((y) => y==x))[0])][ind+1] = e.data[xAxis.indexOf(it[0])]);
        
        return ac;
    }, localidades.map((e) => [e].concat(Array.from({length:keys.length}, () => 0))));

 
    map_data = (map_data.map(e => e.concat(e.slice(1).reduce(([sum, max_p], val, ind, arr) => [sum+=val, (val > arr[max_p]) ? max_p = ind : max_p], [0,0]))));
	map_data.forEach(e => !(e[e.length-2]) && (e[e.length-1]=null));
    for(var i = 0, maxValue = -Infinity,value; i<map_data.length; ((value=map_data[i++][map_data[0].length-2]) > maxValue) && (maxValue=value));

    const colors = new Map();
    keys.forEach((x,i) => 	{	
		const cor = (i * 360 / keys.length) % 360;
		colors.set(x.join(","), `hsl(${cor}, 70%, 50%)`);
	});
	//console.log(colors)

    const DaCl = keys.map((x,i) => {
        return {
            from: i,
            to: ++i,
            color: colors.get(x.join(",")),
            name: x.join(",")
        }
    });

	keys = [].concat('id', ...(keys.map(e => e.join(","))), 'sum', 'value');

	const chart = H_U.mapChart(id, {
        chart: {
            animation: true,
			map: map_json,
			csv_backup: csv,
        },

        accessibility: {
            description: false
        },
        colorAxis: {dataClasses:DaCl},
        
        mapNavigation: {
            enabled: true
        },

        title: {
            text: name,
            align: 'center'
        },

 
        plotOptions: {
            pie: {
                borderWidth: 1,
                clip: true,
                dataLabels: {
                    enabled: false
                },
                states: {
                    hover: {
                        halo: {
                            size: 5
                        }
                    }
                },
                tooltip: {
                    headerFormat: ''
                }

				
            }
        },
					exporting: {
				buttons: {
					contextButton: {
						symbol: 'menu',
						x: -36,
						y: 0,
						theme: {
							fill: '#ffffff',
							'stroke-width': 1,
							stroke: 'silver',
							r: 4,
							style: {
								color: '#000000ff'
							},
							states: {
								hover: {
									fill: '#f0f0f0'
								},
								select: {
									fill: '#e0e0e0c5'
								}
							}
						},
						menuItems: [
							{
								text: 'Tela Cheia',
								onclick: function() {
									this.fullscreen?.toggle();
								},
          },
							{
								text: 'Imprimir',
								onclick: function() {
									this.exporting?.print();
								},
          },
							{
								text: 'Baixar PNG',
								onclick: function() {
									this.exporting?.exportChart();
								},
          },
							{
								text: 'Baixar CSV',
								onclick: function() {
									this.exporting?.downloadCSV();
								},
          },
		  			'separator',
{
								text: "Esconder Rosca",
								onclick: function() {
 									const pies = chart.series.filter(s => s.type == 'pie');

									const anyVisible = pies.some(p => p.visible);
									
 								//	const anyVisible = pies.some(p => p.visible);
									if (anyVisible) {
										pies.forEach(p => p.setVisible(false, false));
										this.exporting.divElements[5].innerText = "Mostrar Roscas";
									} else {
										pies.forEach(p => {
											const legendFiltered = !!(p.options && p.options.custom && p.options.custom.state);
											if (!legendFiltered) {
												p.setVisible(true, false);
											}
										});
										this.exporting.divElements[5].innerText = "Esconder Roscas";
									}
									this.series[0].update({ dataLabels: { enabled: this.exporting.divElements[5].innerText == "Mostrar Roscas"  }});
									chart.redraw();
								}
							},					{
								text: 'Esconder Legendas',
								onclick: function() {
									legenda_text = this.options.legend.enabled ? "Mostrar  Legendas" : "Esconder Legendas";
									this.exporting.divElements[6].innerText = legenda_text;
									this.update({
										legend: {
											enabled: !(this.options.legend.enabled)
										},
									});
								},
					},
        ]
					}
				}
			},

        series: [{
            map_json,
            data: map_data,
            name: 'Localidades',
            borderColor: 'var(--H_L-background-color, white)',
            joinBy: ['id', 'id'],
            keys: keys,
		dataLabels: {
        enabled: false,
        format: '{point.name}',
        style: {
			color: 'black',
             textOutline: '1px white',
            fontWeight: 'bold'
        }},
            tooltip: {
                headerFormat: '',
                pointFormatter(){
                    const hoverVotes = this.hoverVotes;
                    return '<b>' + this.id + ' </b><br/>' +
                    keys.slice(1,keys.length-2).map(e => [e, this[e], colors.get(e)])
					.filter(e => e[1])  
                    .sort((a, b) => b[1] - a[1])  
                    .map(
                                line => '<span style="color:' + line[2] +
                                 '">\u25CF</span> ' +
                                 (line[0] == hoverVotes ? '<b>' : '') +
                                line[0] + ': ' +
                                H_U.numberFormat(line[1], 0) +
                                (line[0] == hoverVotes ? '</b>' : '') +
                                '<br/>'
                            )
                            .join('') +
                        '<hr/>Total: ' +
                        H_U.numberFormat(this.sum, 0);
                }
            }
        }, {
            name: 'Connectors',
            type: 'mapline',
            color: 'rgba(130, 130, 130, 0.5)',
            zIndex: 5,
            showInLegend: false,
            enableMouseTracking: false,
            accessibility: {
                enabled: false
            }
        }]
    });

chart.legend.allItems.forEach(item => {
    const setVisible = item.setVisible;
    item.setVisible = function () {
        const legendItem = this;
        setVisible.call(legendItem);

         chart.series[0].points.forEach(point => {
            const dataClassName = chart.colorAxis[0].dataClasses[point.dataClass]?.name;
            if (dataClassName == legendItem.name) {
                 const pieSeries = H_U.find(chart.series, s => s.name == point.id && s.type == 'pie');
                if (pieSeries) {
 
                    pieSeries.setVisible(legendItem.visible, false);
 
                    if (!pieSeries.options) pieSeries.options = {};
                    if (!pieSeries.options.custom) pieSeries.options.custom = {};
                    pieSeries.options.custom.state = !legendItem.visible;
                }

                 const connector = H_U.find(chart.series[2].points, p => p.name == point.id);
                if (connector) connector.setVisible(legendItem.visible, false);
            }
        });

        chart.redraw();
    };
});
const enable_num = false;
chart.series[0].points.filter(x => x.formatPrefix=='point' && x.sum).forEach(point => {
    const sliceKeys = keys.slice(1, keys.length - 2);
    const nonZeroKeys = sliceKeys.filter(k => point[k] && point[k] > 0);

 if (nonZeroKeys.length <= 1 && enable_num) {
	chart.addSeries({
    type: 'pie',
    name: point.id,
    custom: { state: false },
    zIndex: 6,
    size: 1,
    minSize: 1,
    maxSize: 1,
    onPoint: { id: point.id },
    borderWidth: 0,
    enableMouseTracking: false,
    tooltip: { enabled: false },
    states: { inactive: { enabled: false } },
    data: [{
        name: nonZeroKeys[0] || '',
        y: point.sum,
        color: 'rgba(0,0,0,0)'
    }],
    dataLabels: {
        enabled: true,
        distance: 0,
        inside: true,
        crop: true,                  
        overflow: 'justify',        
      formatter: function () {
        if (!chart || !chart.series || !chart.series[0] || !chart.series[0].points) return '';
        const mapSeries = chart.series[0];
        const mapPoint = mapSeries.points.find(p => p && p.id === point.id);
        if (!mapPoint) return '';
        const px = mapPoint.plotX;
        const py = mapPoint.plotY;
        if (px == null || py == null) return '';
        if (px < 0 || py < 0 || px > chart.plotWidth || py > chart.plotHeight) return '';
        return H_U.numberFormat(this.y, 0);
    },
    style: {
        fontWeight: '700',
        fontSize: '18px',
        textOutline: '2px white'
    }
    },
    visible: true
}, false);


    } else {
        chart.addSeries({
            type: 'pie',
            name: point.id,
            custom: { state: false },
            zIndex: 6,
            minSize: 15,
            maxSize: 55,
            onPoint: {
                id: point.id,
                z: (() => {
                    const zoomFactor = chart.mapView.zoom / chart.mapView.minZoom;
                    return Math.max(
                        chart.chartWidth / 45 * zoomFactor * 20 * sizes.get(point.id) * 2,
                        chart.chartWidth / 11 * (zoomFactor * .7) * point.sum / maxValue * sizes.get(point.id)
                    );
                })()
            },
            states: {
                inactive: { enabled: false }
            },
            accessibility: { enabled: false },
            tooltip: {
                pointFormatter() {
                    let back = { id: point.id, hoverVotes: this.name };
                    keys.slice(1, keys.length - 1).forEach(x => back[x] = point[x]);
                    return point.series.tooltipOptions.pointFormatter.call(back);
                }
            },
            visible: true,
            data: sliceKeys.map(x => ({
                name: x,
                y: point[x],
                color: colors.get(x)
            }))
        }, false);
    }
});


    chart.redraw();
    break;
}

}

function setWhere(value)
{	let content = query(`select distinct ${value} as texto from idosos order by 1 asc`);
    for (const e in content)
		content[e]["codigo"] = value;
	return content;
}

function updateSelect()
{	const allSelects = Array.from(document.querySelectorAll(`.selectFilter`)).concat(Array.from(document.querySelectorAll(`.selectGraphics`))).map((e) => Object({select:e, texto: e.options[e.selectedIndex].innerHTML}));
	const filters = Array.from(document.querySelectorAll(`.selectFilter`)).map((e) => Object({select:e, texto: e.options[e.selectedIndex].innerHTML}));
	
	for(let element of allSelects.filter(e => e.select.className == "selectFilter"))
	{	const result = campos.filter((e) => !(allSelects.map((e) => e.texto)).includes(e.texto) || e.texto == element.texto);

		element.select.innerHTML = result.map((e) => `<option value="${e.codigo}">${e.texto}</option>`).join("");
		element.select.selectedIndex = result.map((e) => e.texto == element.texto).indexOf(true);
	}
	
	for(let element of allSelects.filter(e => e.select.className == "selectGraphics"))
	{	const result = campos.filter((e) => !(filters.map((e) => e.texto)).includes(e.texto) || e.texto == element.texto);

		element.select.innerHTML = result.map((e) => `<option value="${e.codigo}">${e.texto}</option>`).join("");
		element.select.selectedIndex = result.map((e) => e.texto == element.texto).indexOf(true);
	}
}

function fillSelect(select, array)
{	const newSelect = document.createElement('select');
    newSelect.setAttribute('class', `${select}`);
	newSelect.setAttribute("id", `id_${ID[select]}`);
	ID[select]++;
    
    newSelect.innerHTML = array.map((e) => `<option value="${e.codigo}">${e.texto}</option>`).join("");
	return newSelect;
}

function createFilterandWhereSelect()
{	if (document.querySelectorAll(".selectFilter").length > 4)
		return;

	const container = document.createElement('div');
	document.querySelector('.allselectFilter').appendChild(container);
	
	//Filter
	const filter = fillSelect('selectFilter', campos.filter((e) => !Array.from(document.querySelectorAll(`.selectFilter`)).concat(Array.from(document.querySelectorAll(`.selectGraphics`))).map((s) => s.options[s.selectedIndex].innerHTML).includes(e.texto)));

	filter.addEventListener('change', () => 
	{	updateSelect();
		document.querySelector(`#${filter.id}.selectWhere.Fltrs`).innerHTML = setWhere(document.querySelector(`#${filter.id}.selectFilter`).value).map((e) => `<option value="${e.codigo}">${e.texto}</option>`).join("");
		
		toggleMapButton();
	});
	container.appendChild(filter);
	updateSelect();

	//Where
		const where = createFilterButton(filter);
		container.appendChild(where[0]);
		container.appendChild(where[1]);

	//removeButton
	const remove = document.createElement("label");
	remove.setAttribute("class", "removeButton");
	remove.addEventListener("click", () => 
	{	document.querySelector('.allselectFilter').removeChild(container);
		updateSelect();
		toggleMapButton();
	});
	document.querySelectorAll(".selectFilter").length != 1 && container.appendChild(remove);

	toggleMapButton();
}

function toggleMapButton()
{	for(const e of Array.from(document.querySelectorAll(".allselectGraphics > div")))
	{	const haveLocal = Array.from(document.querySelectorAll('.selectFilter')).filter((e) => e.children[e.selectedIndex].innerHTML == campos[0].texto).length;
		const haveMap = Array.from(e.children).filter((e) => e.tagName == "LABEL").filter(e => e.firstChild?.value == 3)[0];

		if(!haveMap && haveLocal)
		{	const radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = `graphicOption_${e.firstChild.id}`;
			radio.value = 3;
			radio.checked = false;

			const button = document.createElement('label');
			button.textContent = '';
			button.prepend(radio);

			e.insertBefore(button, e.children[5]);
		}
		if(haveMap && !haveLocal)
		{	haveMap.firstChild.checked && (Array.from(e.children).filter(e => e.tagName == "LABEL")[1].firstChild.checked = true); 
			e.removeChild(haveMap);
		}
	};
}

function createGraphicSelect()
{	if (document.querySelectorAll(".selectGraphics").length > 14)
		return;

	const container = document.createElement('div');
	document.querySelector(".allselectGraphics").appendChild(container);

	const select = fillSelect('selectGraphics', campos.filter((e) => !Array.from(document.querySelectorAll(`.selectFilter`), s => s.options[s.selectedIndex].innerHTML).includes(e.texto)));
	container.appendChild(select);
	updateSelect();
	select.addEventListener('change', () => {
		updateSelect();
		toggleMapButton();
		document.querySelector(`#${select.id}.selectWhere.Grphcs`).innerHTML = setWhere(document.querySelector(`#${select.id}.selectGraphics`).value).map((e) => `<option value="${e.codigo}">${e.texto}</option>`).join("");
	});

	const radio1 = document.createElement('input');
	radio1.type = 'radio';
	radio1.name = `graphicOption_${container.firstChild.id}`;
	radio1.value = 1;
	radio1.checked = true;

	const label1 = document.createElement('label');
	label1.textContent = '';
	label1.prepend(radio1);

	const radio2 = document.createElement('input');
	radio2.type = 'radio';
	radio2.name = radio1.name;
	radio2.value = 2;

	const label2 = document.createElement('label');
	label2.textContent = '';
	label2.prepend(radio2);
	
	const where = createFilterButton(select);
	container.appendChild(where[0]);
	container.appendChild(where[1]);

	container.appendChild(label1);
	container.appendChild(label2);

	const remove = document.createElement("label");
	remove.setAttribute("class", "removeButton");
	remove.addEventListener("click", () => {
		document.querySelector('.allselectGraphics').removeChild(container);
		updateSelect(0); 
		toggleMapButton();
	});
	document.querySelectorAll(".selectGraphics").length != 1 && container.appendChild(remove);

	toggleMapButton();
}

function createFilterButton(select)
{	//whereButton
	const butWhere = document.createElement("label");
	butWhere.setAttribute("class", "butWhere");
	butWhere.addEventListener('click', () => {
		Array.from(document.querySelectorAll(".floatDivWhere")).filter(where => where.style.display == "flex").map(where => where.style.display = "none");
		floatDivWhere.style.display = "flex";
	});

	//whereSelect
	const floatDivWhere = document.createElement("div");
	floatDivWhere.setAttribute("class", "floatDivWhere");
	Object.assign(floatDivWhere.style, {position: "absolute", right: "0%", top: "100%", display: "none"});

	const selWhere = fillSelect("selectWhere", setWhere(select.value));
	selWhere.setAttribute("id", select.id);
	selWhere.className += ` ${select.className=="selectFilter" ? "Fltrs" : "Grphcs"}`;
	Object.assign(selWhere, { multiple: true, size: 6 });
	selWhere.selectedIndex = -1;
	floatDivWhere.appendChild(selWhere);

	const buttonsWhere = document.createElement("div");
		const acceptWhere = document.createElement("label");
		acceptWhere.addEventListener("click", () => floatDivWhere.style.display = "none" );
		buttonsWhere.appendChild(acceptWhere);

		const todosWhere = document.createElement("label");
		todosWhere.addEventListener("click", () => selWhere.selectedIndex = -1);
		buttonsWhere.appendChild(todosWhere);
	floatDivWhere.appendChild(buttonsWhere);

	return [butWhere, floatDivWhere];
}

// updateSelect();
createFilterandWhereSelect();
createGraphicSelect();
setGraphics();

document.querySelector(".addFilterButton").addEventListener("click", createFilterandWhereSelect);
document.querySelector(".gerar").addEventListener("click", () => {setGraphics();document.querySelector(".config").click();});
document.querySelector(".addGraphicButton").addEventListener("click", createGraphicSelect);
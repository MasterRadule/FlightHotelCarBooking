const TOKEN_KEY = "jwtToken";

const tileLayerURL = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";
const MAP_ZOOM = 12;
const MAX_MAP_ZOOM = 19;
const MAP_ID = 'mapbox.streets';

const editHotelURL = "/api/editHotel";
const getAdditionalServicesURL = "/api/getAdditionalServicesURL";
const getRoomsURL = "/api/getRooms";
const getHotelOfAdminURL = "/api/getHotelOfAdmin";
const getHotelRoomURL = "/api/getHotelRoom";
const addHotelRoomURL = "/api/addHotelRoom";
const editHotelRoomURL = "/api/editHotelRoom/";
const deleteHotelRoomURL = "/api/deleteHotelRoom/";
const addSeasonalPriceURL = "/api/addSeasonalPrice/";
const deleteSeasonalPriceURL = "/api/deleteSeasonalPrice/";
const getIncomeOfHotelURL = "/api/getIncomeOfHotel";
const getHotelDailyChartDataURL = "/api/getHotelDailyChartData";
const getHotelWeeklyChartDataURL = "/api/getHotelWeeklyChartData";
const getHotelMonthlyChartDataURL = "/api/getHotelMonthlyChartData";
const addAdditionalServiceURL = "/api/addAdditionalService";

const logoutURL = "../logout";
const loadUserInfoURL = "../api/getUserInfo";
const editUserInfoURL = "../api/editUser";
const changePasswordURL = "../changePassword";

var destMap = null;
var shownRoom = null;
var hotelName = null;

$(document).ready(function() {

	setUpToastr();
	setUpTabView();
	setUpTables();
	loadData();
	getDailyChartData();

	setUpEditHotelForm();
	setUpNewHotelRoomForm();
	setUpNewSeasonalPriceForm();
	setUpShownHotelRoomForm();
	setUpNewAdditionalServiceForm();
	setUpEditForm();

	$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
		$($.fn.dataTable.tables(true)).DataTable().columns.adjust();
	});

	$("#logout").click(function() {
		document.location.href = logoutURL;
	});

	$('.edit').click(function() {
		if ($(this).siblings().first().is('[readonly]')) {
			$(this).siblings().first().removeAttr('readonly');
		} else {
			$(this).siblings().first().prop('readonly', 'true');
		}
	});

	$('#showHotelRoomModal').on('hidden.bs.modal', function() {
		roomsTable.$('tr.selected').removeClass('selected');
		shownRoom = null;
	});

	$('#showIncomeDateRange').daterangepicker({
		locale : {
			format : 'DD/MM/YYYY'
		}
	});
})

function loadData() {
	loadHotel();
	loadProfileData();
}

function setUpTables() {
	roomsTable = $('#roomsTable').DataTable({
		"paging" : false,
		"info" : false,
	});
	$('#additionalServicesTable').DataTable({
		"paging" : false,
		"info" : false,
	});
	$('#quickReservationsTable').DataTable({
		"paging" : false,
		"info" : false,
	});
	seasonalPricesTable = $('#seasonalPricesTable').DataTable({
		"paging" : false,
		"info" : false,
		"columnDefs" : [ {
			"orderable" : false,
			"targets" : 3
		} ]
	});

	$('#roomsTable tbody').on('click', 'tr', function() {
		roomsTable.$('tr.selected').removeClass('selected');
		$(this).addClass('selected');
		loadHotelRoom(roomsTable.row(this).data()[0]);
		shownRoom = roomsTable.row(this).data()[0];
		$("#showHotelRoomModal").modal();
	});

}

function setUpTabView() {
	$(".nav li").click(function() {
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
	});
	$('.nav-tabs a').click(function() {
		$(this).tab('show');
	});
	$(
			'a[href="#basicTab"], a[href="#roomsTab"], a[href="#additionalServicesTab"], a[href="#quickResevationsTab"]')
			.click(function() {
				loadHotel();
			});
	$('a[href="#profile"]').click(function() {
		loadProfileData();
	});
	$('a[href="#basicTab"]').on('shown.bs.tab', function() {
		if (destMap != null)
			destMap.invalidateSize();
	})
}

function setUpMap(latitude, longitude, div) {
	if (destMap != null) {
		destMap.off();
		destMap.remove();
	}
	destMap = L.map(div).setView([ latitude, longitude ], MAP_ZOOM);
	L.tileLayer(tileLayerURL, {
		maxZoom : MAX_MAP_ZOOM,
		id : MAP_ID
	}).addTo(destMap);
	var marker = L.marker([ latitude, longitude ], {
		draggable : true
	}).addTo(destMap);
	marker.on('dragend', function(e) {
		$("#latitude").val(marker.getLatLng().lat);
		$("#longitude").val(marker.getLatLng().lng);
	});
}

function loadHotel() {
	$.ajax({
		dataType : "json",
		type : "GET",
		url : getHotelOfAdminURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		success : function(data) {
			$("#hotelName").val(data["name"]);
			$("#hotelGrade").text(data["averageGrade"]);
			$("#hotelDescription").text(data["description"]);
			setUpMap(data["latitude"], data["longitude"], 'basicMapDiv');
			renderAdditionalServices(data["additionalServices"]);
			renderRooms(data["rooms"]);
			// renderQuickReservations[data["quickReservations"]];
		}
	});
}

function loadHotelRoom(roomNumber) {
	$.ajax({
		type : 'GET',
		contentType : "application/json",
		data : {
			'roomNumber' : roomNumber
		},
		dataType : "json",
		url : getHotelRoomURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		success : function(data) {
			$("#shownRoomNumber").val(data["roomNumber"]);
			$("#shownRoomAverageGrade").val(data["averageGrade"]);
			$("#shownRoomDefaultPrice").val(data["defaultPrice"]);
			$("#shownRoomNumberOfPeople").val(data["numberOfPeople"]);
			renderSeasonalPrices(data["seasonalPrices"]);
		}
	});

}

function renderAdditionalServices(data) {
	var table = $('#additionalServicesTable').DataTable();
	table.clear().draw();
	$.each(data, function(i, val) {
		table.row.add([ val.name, val.price ]).draw(false);
	});
}

function renderRooms(data) {
	roomsTable.clear().draw();
	$.each(data, function(i, val) {
		rowNode = roomsTable.row.add(
				[ val.roomNumber, val.price, val.numberOfPeople,
						val.averageGrade ]).draw(false).node();
		if (val.roomNumber == shownRoom)
			$(rowNode).addClass('selected');
	});
}

function renderSeasonalPrices(data) {
	seasonalPricesTable.clear().draw();
	$
			.each(
					data,
					function(i, val) {
						seasonalPricesTable.row
								.add(
										[
												val.price,
												val.fromDate,
												val.toDate,
												`<a href="javascript:deleteSeasonalPrice('${val.fromDate}', '${val.toDate}')">Delete</a>` ])
								.draw(false);
					});

}

function deleteSeasonalPrice(fromDate, toDate) {
	fromDate = new Date(fromDate);
	toDate = new Date(toDate);
	$.ajax({
		type : 'DELETE',
		url : deleteSeasonalPriceURL + shownRoom,
		contentType : 'application/json',
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		dataType : "json",
		data : JSON.stringify({
			"fromDate" : fromDate,
			"toDate" : toDate
		}),
		success : function(data) {
			loadHotel();
			loadHotelRoom(shownRoom);
			if (data != "") {
				toastr[data.toastType](data.message);
			}

		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

/* USER PROFILE JS */

function loadProfileData() {
	let token = getJwtToken("jwtToken");
	$.ajax({
		type : 'GET',
		url : loadUserInfoURL,
		dataType : "json",
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		success : function(data) {
			if (data != null) {
				$('input[name="fname"]').val(data.firstName);
				$('input[name="lname"]').val(data.lastName);
				$('input[name="phone"]').val(data.phone);
				$('input[name="address"]').val(data.address);
				$('#email').text(data.email);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

$(document).on("click", "#changePasswordButton", function(e) {
	e.preventDefault();
	document.location.href = changePasswordURL;
});

function userEditFormToJSON(firstName, lastName, phone, address, email) {
	return JSON.stringify({
		"firstName" : firstName,
		"lastName" : lastName,
		"phoneNumber" : phone,
		"address" : address,
		"email" : email
	});
}

function setUpEditHotelForm() {
	$('#editHotelForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			type : 'PUT',
			url : editHotelURL,
			headers : createAuthorizationTokenHeader(TOKEN_KEY),
			contentType : "application/json",
			data : JSON.stringify({
				"name" : $("#hotelName").val(),
				"description" : $("#hotelDescription").val(),
				"latitude" : $("#latitude").val(),
				"longitude" : $("#longitude").val(),
			}),
			dataType : "json",
			success : function(data) {
				loadHotel();
				if (data != "") {
					toastr[data.toastType](data.message);
				}
			}
		});
	});
}

function setUpNewHotelRoomForm() {
	$('#newHotelRoomForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			type : 'POST',
			url : addHotelRoomURL,
			contentType : 'application/json',
			headers : createAuthorizationTokenHeader(TOKEN_KEY),
			dataType : "json",
			data : JSON.stringify({
				"roomNumber" : $("#newRoomNumber").val(),
				"price" : $("#newRoomDefaultPrice").val(),
				"numberOfPeople" : $("#newRoomNumberOfPeople").val(),
			}),
			success : function(data) {
				loadHotel();
				if (data != "") {
					toastr[data.toastType](data.message);
				}
			},
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				alert("AJAX ERROR: " + textStatus);
			}
		});
	});

}

function setUpNewSeasonalPriceForm() {
	$('#newSeasonalPriceForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			type : 'POST',
			url : addSeasonalPriceURL + shownRoom,
			contentType : 'application/json',
			headers : createAuthorizationTokenHeader(TOKEN_KEY),
			dataType : "json",
			data : JSON.stringify({
				"price" : $("#newSeasonalPricePrice").val(),
				"fromDate" : $("#newSeasonalPriceFrom").val(),
				"toDate" : $("#newSeasonalPriceTo").val(),
			}),
			success : function(data) {
				loadHotel();
				loadHotelRoom(shownRoom);
				if (data != "") {
					toastr[data.toastType](data.message);
				}
			},
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				alert("AJAX ERROR: " + textStatus);
			}
		});
	});
}

function setUpShownHotelRoomForm() {
	$('#shownHotelRoomForm').on('submit', function(e) {
		e.preventDefault();
		newRoomNumber = $("#shownRoomNumber").val();
		$.ajax({
			type : 'PUT',
			url : editHotelRoomURL + shownRoom,
			contentType : 'application/json',
			headers : createAuthorizationTokenHeader(TOKEN_KEY),
			dataType : "json",
			data : JSON.stringify({
				"roomNumber" : newRoomNumber,
				"price" : $("#shownRoomDefaultPrice").val(),
				"numberOfPeople" : $("#shownRoomNumberOfPeople").val(),
			}),
			success : function(data) {
				if (data.toastType == "success") {
					shownRoom = newRoomNumber;
				}
				loadHotel();
				loadHotelRoom(shownRoom);
				if (data != "") {
					toastr[data.toastType](data.message);
				}
			},
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				alert("AJAX ERROR: " + textStatus);
			}
		});
	});
}

function setUpNewAdditionalServiceForm(){
	$('#newAdditionalServiceForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			type : 'POST',
			url : addAdditionalServiceURL,
			contentType : 'application/json',
			headers : createAuthorizationTokenHeader(TOKEN_KEY),
			dataType : "json",
			data : JSON.stringify({
				"name" : $("#newAdditionalServiceName").val(),
				"price" : $("#newAdditionalServicePrice").val(),
			}),
			success : function(data) {
				loadHotel();
				if (data != "") {
					toastr[data.toastType](data.message);
				}
			},
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				alert("AJAX ERROR: " + textStatus);
			}
		});
	});
}

function setUpEditForm() {
	$('#userEditForm').on(
			'submit',
			function(e) {
				e.preventDefault();
				let firstName = $('input[name="fname"]').val();
				let lastName = $('input[name="lname"]').val();
				let phone = $('input[name="phone"]').val();
				let address = $('input[name="address"]').val();
				let email = $('#email').text();

				$.ajax({
					type : 'PUT',
					url : editUserInfoURL,
					contentType : 'application/json',
					headers : createAuthorizationTokenHeader(TOKEN_KEY),
					dataType : "json",
					data : userEditFormToJSON(firstName, lastName, phone,
							address, email),
					success : function(data) {
						if (data != "") {
							toastr[data.toastType](data.message);
						}
					},
					error : function(XMLHttpRequest, textStatus, errorThrown) {
						alert("AJAX ERROR: " + textStatus);
					}
				});
			});
}

function setUpToastr() {
	toastr.options = {
		"closeButton" : true,
		"debug" : false,
		"newestOnTop" : false,
		"progressBar" : false,
		"positionClass" : "toast-top-center",
		"preventDuplicates" : false,
		"onclick" : null,
		"showDuration" : "300",
		"hideDuration" : "1000",
		"timeOut" : "3000",
		"extendedTimeOut" : "1000",
		"showEasing" : "swing",
		"hideEasing" : "linear",
		"showMethod" : "fadeIn",
		"hideMethod" : "fadeOut"
	}
}

function deleteRoom() {
	$.ajax({
		type : 'DELETE',
		dataType : "json",
		url : deleteHotelRoomURL + shownRoom,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		success : function(data) {
			loadHotel();
			$("#showHotelRoomModal").modal('hide');
			if (data != "") {
				toastr[data.toastType](data.message);
			}
		}
	});
}

function showIncome(e) {
	e.preventDefault();
	var drp = $('#showIncomeDateRange').data('daterangepicker');
	$.ajax({
		type : 'GET',
		url : getIncomeOfHotelURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		contentType : 'application/json',
		data : {
			'fromDate' : drp.startDate.toDate(),
			'toDate' : drp.endDate.toDate()
		},
		success : function(data) {
			if (data != null) {
				$("#income").html("Income of airline: " + data + "EUR");
				$("#income").show();
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

function changeGraphic(level) {
	$('#chart').remove();
	$('#chartDiv').append('<canvas id="chart"><canvas>');
	if (level == "daily") {
		getDailyChartData();
	}
	else if (level == "weekly") {
		getWeeklyChartData();
	}
	else {
		getMonthlyChartData();
	}
}

function getDailyChartData() {
	$.ajax({
		type : 'GET',
		url : getHotelDailyChartDataURL,
		dataType : "json",
		headers: createAuthorizationTokenHeader(TOKEN_KEY),
		success: function(data){
			makeDailyChart(data, dayComparator);
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

function getWeeklyChartData() {
	$.ajax({
		type : 'GET',
		url : getHotelWeeklyChartDataURL,
		dataType : "json",
		headers: createAuthorizationTokenHeader(TOKEN_KEY),
		success: function(data){
			makeWeeklyChart(data, weekComparator);
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

function getMonthlyChartData() {
	$.ajax({
		type : 'GET',
		url : getHotelMonthlyChartDataURL,
		dataType : "json",
		headers: createAuthorizationTokenHeader(TOKEN_KEY),
		success: function(data){
			makeMonthlyChart(data, monthComparator);
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

















/* Graphic charts */

function dayComparator(a, b) {
	let aTokens = a.split("/");
	let bTokens = b.split("/");
	
	let aYear = parseInt(aTokens[2]);
	let bYear = parseInt(bTokens[2]);
	let aMonth = parseInt(aTokens[1]);
	let bMonth = parseInt(bTokens[1]);
	let aDay = parseInt(aTokens[0]);
	let bDay = parseInt(bTokens[0]);
	
	if(aYear > bYear) {
		return 1;
	} else if(aYear < bYear) {
		return -1;
	} else {
		if(aMonth > bMonth) {
			return 1;
		} else if(aMonth < bMonth) {
			return -1;
		} else {
			if(aDay > bDay) {
				return 1;
			} else if(aDay < bDay) {
				return -1;
			} else {
				return 0;
			}
		}
	}
}

function weekComparator(a, b) {
	// date week: num
	let aTokens = a.split(" ");
	let aDate = aTokens[0].split("/");
	
	let aWeek = aTokens[2];
	let aMonth = parseInt(aDate[0]);
	let aYear = parseInt(aDate[1]);
	
	let bTokens = b.split(" ");
	let bDate = bTokens[0].split("/");
	
	let bWeek = bTokens[2];
	let bMonth = parseInt(bDate[0]);
	let bYear = parseInt(bDate[1]);
	
	if(aYear > bYear) {
		return 1;
	} else if(aYear < bYear) {
		return -1;
	} else {
		if(aMonth > bMonth) {
			return 1;
		} else if(aMonth < bMonth) {
			return -1;
		} else {
			if(aWeek > bWeek) {
				return 1;
			} else if(aWeek < bWeek) {
				return -1;
			} else {
				return 0;
			}
		}
	}
}

function monthComparator(a, b) {
	let aDate = a.split("/");
	let aMonth = parseInt(aDate[0]);
	let aYear = parseInt(aDate[1]);
	
	let bDate = b.split("/");
	let bMonth = parseInt(bDate[0]);
	let bYear = parseInt(bDate[1]);
	
	if(aYear > bYear) {
		return 1;
	} else if(aYear < bYear) {
		return -1;
	} else {
		if(aMonth > bMonth) {
			return 1;
		} else if(aMonth < bMonth) {
			return -1
		} else {
			return 0;
		}
	}
}

function makeDailyChart(data, comparator) {
	let labels = (Object.keys(data)).sort(comparator);
	let values = [];

	for(let label of labels) {
		values.push(data[label]);
	}

	let timeFormat = "DD/MM/YYYY";
	let startDate = moment(moment(labels[0], timeFormat).subtract(3, 'days')).format(timeFormat);
	let endDate = moment(moment(labels[labels.length - 1], timeFormat).add(3, 'days')).format(timeFormat);

	let chart = new Chart($('#chart'), {
	    type: 'bar',
	    data: {
	        labels: labels,
	        datasets: [{
	            label: 'Number of reservations',
	            backgroundColor: 'rgb(255, 99, 132)',
	            borderColor: 'rgb(255, 99, 132)',
	            data: values
	        }]
	    },
	    options: {
	    	responsive:true,
	    	maintainAspectRatio: false,
	        scales: {
	        	xAxes: [{
                    type: "time",
                    time: {
                        parser: timeFormat,
                        unit: 'day',                    
                        unitStepSize: 1,
                        minUnit: 'day',
                        min: startDate,
                        max: endDate,
                        tooltipFormat: 'll'
                    },
                    scaleLabel: {
                        display:     true,
                        labelString: 'Date'
                    },
                    ticks: {
                    	autoSkip: true,
                        maxTicksLimit: 30
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display:     true,
                        labelString: 'value'
                    },
                    ticks: {
	                	beginAtZero: true
	                }
                }]
	        },
	        pan: {
	            enabled: true,
	            mode: 'x',
	        },
	        zoom: {
	        	enabled: true,
	        	mode: 'x'
	        }
	    }
	});
}

function makeWeeklyChart(data, comparator) {
	let labels = (Object.keys(data)).sort(comparator);
	let values = [];

	for(let label of labels) {
		values.push(data[label]);
	}

	let chart = new Chart($('#chart'), {
	    type: 'bar',
	    data: {
	        labels: labels,
	        datasets: [{
	            label: 'Number of reservations',
	            backgroundColor: 'rgb(255, 99, 132)',
	            borderColor: 'rgb(255, 99, 132)',
	            data: values
	        }]
	    },
	    options: {
	    	responsive:true,
	    	maintainAspectRatio: false,
	        scales: {
	            yAxes: [{
	                ticks: {
	                	beginAtZero: true
	                }
	            }]
	        },
	        pan: {
	            enabled: true,
	            mode: 'x',
	        }
	    }
	});
}

function makeMonthlyChart(data, comparator) {
	let labels = (Object.keys(data)).sort(comparator);
	let values = [];

	for(let label of labels) {
		values.push(data[label]);
	}

	let timeFormat = "MM/YYYY";
	let startDate = moment(moment(labels[0], timeFormat).subtract(1, 'months')).format(timeFormat);
	let endDate = moment(moment(labels[labels.length - 1], timeFormat).add(1, 'months')).format(timeFormat);

	let chart = new Chart($('#chart'), {
	    type: 'bar',
	    data: {
	        labels: labels,
	        datasets: [{
	            label: 'Number of reservations',
	            backgroundColor: 'rgb(255, 99, 132)',
	            borderColor: 'rgb(255, 99, 132)',
	            data: values
	        }]
	    },
	    options: {
	    	responsive:true,
	    	maintainAspectRatio: false,
	        scales: {
	        	xAxes: [{
                    type: "time",
                    time: {
                    	parser: timeFormat,
                        unit: 'month',                    
                        minUnit: 'month',
                        min: startDate,
                        max: endDate,
                        tooltipFormat: 'll'
                    },
                    scaleLabel: {
                        display:     true,
                        labelString: 'Date'
                    },
                    ticks: {
                    	autoSkip: true,
                        maxTicksLimit: 30
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display:     true,
                        labelString: 'value'
                    },
                    ticks: {
	                	beginAtZero: true
	                }
                }]
	        },
	        pan: {
	            enabled: true,
	            mode: 'x',
	        },
	        zoom: {
	        	enabled: true,
	        	mode: 'x'
	        }
	    }
	});
}

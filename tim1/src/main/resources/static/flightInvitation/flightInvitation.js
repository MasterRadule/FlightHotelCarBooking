const TOKEN_KEY = 'jwtToken';
const getInvitingReservationsURL = "/api/getInvitingReservations";
const acceptFlightInvitationURL = "/api/acceptFlightInvitation";
const declineFlightInvitationURL = "/api/declineFlightInvitation";

$(document).ready(function() {
	
	getReservations();
	setUpToastr();
	
	$('#reservationsTable').DataTable({
		"paging" : false,
		"info" : false,
		"scrollY" : "17vw",
		"scrollCollapse" : true,
		"retrieve" : true,
	});
	
	$('#reservationsTable tbody').on('click', 'td', function(event) {
		var tgt = $(event.target);
		if (tgt[0].innerHTML == "Accept") {
			var table = $("#reservationsTable").DataTable();
			var rowData = table.cell(this).row().data();
			acceptInvitation(rowData[0]);
		} else if (tgt[0].innerHTML == "Decline") {
			var table = $("#reservationsTable").DataTable();
			var rowData = table.cell(this).row().data();
			declineInvitation(rowData[0]);
		}
	});
});
	
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

function getReservations() {
	$.ajax({
		type : 'GET',
		url : getInvitingReservationsURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		success : function(data) {
			if (data != null) {
				var table = $("#reservationsTable").DataTable();
				table.clear().draw();
				$.each(data, function(i, val) {
					var inv = "<div id='invStatus'><button id='invButton' class='btn btn-default'>Accept</button>";
					inv += "<button id='invButton' class='btn btn-default'>Decline</button></div>";
					table.row.add([ val.reservationID, val.description, inv ]).draw(false);
				});
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

function acceptInvitation(resID) {
	$.ajax({
		type : 'POST',
		url : acceptFlightInvitationURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		data : resID.toString(),
		success : function(data) {
			if (data.toastType == "success") {
				toastr[data.toastType](data.message);
				getReservations();
			} else {
				toastr[data.toastType](data.message);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}

function declineInvitation(resID) {
	$.ajax({
		type : 'POST',
		url : declineFlightInvitationURL,
		headers : createAuthorizationTokenHeader(TOKEN_KEY),
		data : resID.toString(),
		success : function(data) {
			if (data.toastType == "success") {
				toastr[data.toastType](data.message);
				getReservations();
			} else {
				toastr[data.toastType](data.message);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("AJAX ERROR: " + textStatus);
		}
	});
}
var outOfStateCheckbox = document.getElementById('outOfStateCheckbox');
var caseNumberInput = document.getElementById('CaseNumber');
outOfStateCheckbox.addEventListener('click', selectOutOfState);


function selectOutOfState() {
	if(outOfStateCheckbox.checked) {
		caseNumberInput.value = 'OOS';
	} else {
		caseNumberInput.value = '';
	}
}
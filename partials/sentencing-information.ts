var outOfStateCheckbox = document.getElementById('outOfStateCheckbox') as HTMLInputElement;
var caseNumberInput = document.getElementById('CaseNumber') as HTMLInputElement;
outOfStateCheckbox.addEventListener('click', selectOutOfState);


function selectOutOfState() {
	if(outOfStateCheckbox.checked) {
		caseNumberInput.value = 'OOS';
	} else {
		caseNumberInput.value = '';
	}
}
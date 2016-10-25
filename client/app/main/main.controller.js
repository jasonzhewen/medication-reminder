'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {

    var start = moment().format('MM/DD/YYYY'),
        end = moment().add(1, 'day').format('MM/DD/YYYY');  

    //Init the View Model of medication board
    $scope.medicationViewModel = {
        titleColor: 'color_info',
        contentColor:'alert-info',
        title: 'Upcoming Medication',
        date: moment().format('MMMM Do , YYYY'),
        state:'upcoming',
        medNum: {
            upcomingNum: 0,
            completedNum: 0,
            missedNum:0
        }
    };

    //Init background and font color of medication board
    $scope.indicationViewModel = {
        indicationShow : false,
        indicationTime : '',
        indicationName : '',
        indicationDosage : ''
    };
    
    /**
      *Init view
    **/
    $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
        $scope.meds = meds.data; 
        countMedication();
        $scope.getMedicationByType($scope.medicationViewModel.state);
        $scope.date = $scope.medicationViewModel.date;
    });

    /**
      *DatePicker Trigger
    **/
    $scope.getMedicationByDate = function () {
        $scope.medicationViewModel.date = moment(new Date($scope.date)).format('MMMM Do , YYYY');
        var selectedDate = moment(new Date($scope.date)).format('MM/DD/YYYY'),
            selectedEndDate = moment(new Date($scope.date)).add(1, 'day').format('MM/DD/YYYY');

        $http.get('/api/medications?start=' + selectedDate + '&end=' + selectedEndDate).then(function (meds) {
            $scope.meds = meds.data;
            countMedication();
            $scope.getMedicationByType($scope.medicationViewModel.state);
        });
    }

    /**
      *Get the number for each kind of medication
    **/
    function countMedication() {
        $scope.medicationViewModel.medNum.completedNum = 0;
        $scope.medicationViewModel.medNum.missedNum = 0;
        $scope.medicationViewModel.medNum.upcomingNum = 0;
        angular.forEach($scope.meds, function(value, key) {  
            if (value.completed === true) {
                $scope.medicationViewModel.medNum.completedNum += 1;
            }
            else if (value.completed === false && moment().diff(moment(value.time)) >= 300000) {
                $scope.medicationViewModel.medNum.missedNum += 1;
            }
            else {
                $scope.medicationViewModel.medNum.upcomingNum += 1;
            }
        });  
    };

    /**
      * Get medication by selected type
    **/
    $scope.getMedicationByType = function(type) {
        $scope.med = [];
        if (type === 'missed') {
            $scope.medicationViewModel.state = 'missed';
            resetBoardStyle('color_danger', 'alert-danger', 'Missed Medication');
            angular.forEach($scope.meds, function (value, key) {
                if (value.completed === false && moment().diff(moment(value.time)) >= 300000) {
                    $scope.med.push(value);
                }
            });
        }
        else if (type === 'completed') {
            $scope.medicationViewModel.state = 'completed';
            resetBoardStyle('color_success', 'alert-success', 'Completed Medication');
            angular.forEach($scope.meds, function (value, key) {
                if (value.completed === true) {
                    $scope.med.push(value);
                }
            });
        }
        else {
            $scope.medicationViewModel.state = 'upcoming';
            resetBoardStyle('color_info', 'alert-info', 'Upcoming Medication');
            angular.forEach($scope.meds, function (value, key) {
                if (value.completed === false && moment(value.time).diff(moment()) >= -300000) {
                    $scope.med.push(value);
                }
            });
        }
    };

    function resetBoardStyle(titleC, contentC, title) {
        $scope.medicationViewModel.titleColor = titleC;
        $scope.medicationViewModel.contentColor = contentC;
        $scope.medicationViewModel.title = title;
    }


    
    /**
      *Check if it is time for the next medication
    **/
    $window.setInterval(function () {
        checkIndication();
    }, 1000);

    function checkIndication() {
        for (var i = 0; i < $scope.meds.length; i++) {
            if (moment().diff(moment($scope.meds[i].time)) == 0) {
                $scope.indicationViewModel.indicationShow = true;
                $scope.indicationViewModel.indicationTime = moment($scope.meds[i].time).format('h:mm:ss A');
                $scope.indicationViewModel.indicationName = $scope.meds[i].name;
                $scope.indicationViewModel.indicationDosage = $scope.meds[i].dosage;
                $scope.$apple();
            }
        }
    };

    $scope.hideIndication = function () {
        $scope.indicationShow = false;
    };
    /**
      *Indication End
    **/


    /**
      *'Complete' button show and complete message
    **/
    $scope.completeButtonShow = function (m) {
        if (moment(m.time).diff(moment()) >= 300000 || m.completed == true)
            return false;
        else
            return true;
    };
    $scope.checkComplete = function (m) {
        if (m.d.f == null || m.d.f === undefined) {
            $scope.completeTime = '';
            return false;
        }
        else {
            $scope.completeTime ='Completed ' + moment(m.d.f).format('h:mm:ss A');
            return true;
        }
    };

    /**
      * 'Complete' button click event
    **/
    $scope.completeMedication = function (m) {
        var obj = {
            name: m.name,
            dosage: m.dosage,
            time: m.time,
            completed: true,
            d: {
                c: m.d.c,
                m: '',
                f: moment().toDate()
            }
        };
        $http.put('/api/medications/' + m._id, JSON.stringify(obj)).then(function (meds) {
            m.completed = meds.data.completed;
            m.d.f = meds.data.d.f;
            m.d.m = meds.data.d.m;
            countMedication();
            $scope.getMedicationByType($scope.medicationViewModel.state);
        });
    };

});

angular.module('medicationReminderApp').filter('dateFormat', function () {
    return function (input) {
        if (angular.isDefined(input)) {
            input = moment(input).format('h:mm:ss A');
        }
        return input;
    };
});
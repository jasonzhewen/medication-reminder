'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {

    var start = moment().format('MM/DD/YYYY'),
        end = moment().add(1, 'day').format('MM/DD/YYYY');
    $scope.indicationShow = false;
    $scope.indicationTime = '';
    $scope.indicationName = '';
    $scope.indicationDosage = '';

    $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
        $scope.meds = meds.data;
    });

    $window.setInterval(function () {
        $scope.currentTime = moment().format('h:mm:ss A');
        $scope.currentDate = moment().format('MMMM Do , YYYY');
        checkIndication();
        $scope.$apply();
    }, 1000);

    $scope.getMedicationByDate = function () {
        var selectedDate = moment(new Date($scope.date)).format('MM/DD/YYYY'),
            selectedEndDate = moment(new Date($scope.date)).add(1, 'day').format('MM/DD/YYYY');

        $http.get('/api/medications?start=' + selectedDate + '&end=' + selectedEndDate).then(function (meds) {
            $scope.meds = meds.data;
        });
    }
    
    function checkIndication() {
        for (var i = 0; i < $scope.meds.length; i++) {
            if (moment().diff(moment($scope.meds[i].time)) == 0) {
                $scope.indicationShow = true;
                $scope.indicationTime = moment($scope.meds[i].time).format('h:mm:ss A');
                $scope.indicationName = $scope.meds[i].name;
                $scope.indicationDosage = $scope.meds[i].dosage;
            }
        }
    };

    $scope.hideIndication = function () {
        $scope.indicationShow = false;
    };

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
        });
    };

    $scope.missedFilter = function (m) {
        return (m.completed == false && moment().diff(moment(m.time)) >= 300000);
    };

    $scope.checkButton1 = function (m) {
        return (m.completed == true);
    };

    $scope.checkButton2 = function (m) {
        return (m.completed == false && moment().diff(moment(m.time)) >= 300000);
    };

    $scope.checkButton3 = function (m) {
        return (m.completed == false && moment().diff(moment(m.time)) < 300000);
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
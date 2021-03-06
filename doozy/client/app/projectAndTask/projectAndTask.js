angular.module('app.projectAndTask', [])

.controller('ProjectAndTaskController', function($scope, $state, $stateParams, Tasks, Users, Project, Auth) {
  console.log($stateParams.projectId);
  // make sure the 'Add Task' button is showing when the page loads
  $scope.showAddTaskButton = true;
  $scope.user = {};
  $scope.task = {};
  $scope.data = {};
  $scope.data.tasks = [];


  Users.getLoggedInUser()
    .then(function(user){
      $scope.user = user;
    });

  // Current Project Id is passed on through $stateParams
  $scope.getProjectInfo = function() {
    Project.getProjectById($stateParams.projectId)
      .then(function(project) {
        console.log(project);
        $scope.data.project = project;
        $scope.data.tasks = project.tasks;
        $scope.getProjectUsers();
      })
  };

  $scope.getProjectInfo();
  // get all of the User objects from the database and save them
  // these users populate the 'Assignee' dropdown menue of the task form
  $scope.getProjectUsers = function() {
    Project.getUserByProjectId($scope.data.project._id)
      .then(function(users) {
        $scope.data.projectUsers = users;
        $scope.getTaskUsers();
        console.log($scope.data.tasks);
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  $scope.getTaskUsers = function(){
    $scope.data.tasks = $scope.data.tasks.map(function(task){
      task.users = [];
      $scope.data.projectUsers.forEach(function(user){
        user.task_list.forEach(function(userTask){
          if(task._id === userTask._id){
            task.users.push(user);
          }
        });
      });
      return task;
    });
  };

  $scope.submitTask = function(data){
    if(data._id){
      if(data.userId){
        $scope.assignUserToTask(data.userId, data._id);
      }
      $scope.updateTask(data);
    } else {
      $scope.createTask(data);
    }
  }

  $scope.createNewTask = function(data) {
    data.projectId = $scope.data.project._id;
    Tasks.createTaskByProject(data)
      .then(function(task) {
        if(data.userId){
          $scope.assignUserToTask(data.userId, task._id);
        }
        $scope.getProjectInfo();
      });
  };

  $scope.assignUserToTask = function(userId, taskId){
    Users.addTaskToUser({
      userId: userId,
      taskId: taskId
    }).then(function(){
      $scope.getProjectInfo();
    });
  };

  // update a task if it already exists or create a new task if one does not already exist
  // this function is called anytime the task form is submitted
  $scope.createTask = function(task) {
    // check for a blank form
    var found = false;
    task.isAssigned = false;
    task.projectId = $scope.getProjectId;
    task.username = task.assigned;
    if (task.username) {
      task.isAssigned = true;
    } else {
      task.isAssigned = false;
    }
    //task.assignee
    var changedUser = false;

    // modify the users property of the task object so that is correctly formatted for the api request
    for (var i = 0; i < $scope.data.tasks.length; i++) {
      var currentTask = $scope.data.tasks[i];
      if (task._id && task._id === currentTask._id) {
        found = true;
        console.log("in update", task)
        Tasks.updateTaskById(task)
          .then(function(resp) {
            $scope.getProjectInfo();
          })
          .catch(function(err) {
            console.log(err);
          });
      }
    }

    if (!found) {
      Tasks.createTaskByProject(task)
        .then(function(resp) {
          if (task.username) {
            Users.addTaskToUser({
                userId: task.username,
                taskId: resp._id
              })
              .then(function(resp) {
                $scope.getProjectInfo();
              })
              .catch(function(err) {
                console.log(err);
              });
          }

        })
        .catch(function(err) {
          console.log(err);
        });
    }
  };

  // delete a task from the database
  $scope.updateTask = function(task) {
    Tasks.updateTaskById(task).then(function(resp) {
        $scope.getProjectInfo()
      })
      .catch(function(err) {
        console.log(err);
      });
  }
  $scope.deleteTask = function(task) {
    Tasks.removeTask(task._id)
      .then(function() {
        $scope.getProjectInfo();
      })
      .catch(function(err) {
        console.log(err);
      });
  };

  // load task details into the task form
  // this function is called anytime that you click on a individual task
  $scope.loadTaskDetails = function(task) {
    console.log("in loading", task);
    // hide the 'Add Task' button
    $scope.showAddTaskButton = false;
    // show the task form
    $scope.showTaskForm = true;

    // load the task details into the form
    $scope.task = {};
    $scope.task._id = task._id;
    $scope.task.name = task.name;
    // only load the first user from the users array
    $scope.task.users = task.users;
    $scope.task.description = task.description;
  };

  // reset the task form
  // this function is called anytime the task form is submitted or closed
  $scope.resetTaskDetails = function() {
    // reset the task form if it was dirty
    if ($scope.task) {
      $scope.task.name = null;
      $scope.task.assigned = null;
      $scope.task.description = null;
      // reset the form validation
      $scope.taskForm.$setUntouched();
    }

    // hide the task form
    $scope.showTaskForm = false;
    // show the 'Add Task' button
    $scope.showAddTaskButton = true;
  };


  // if a task is not completed and does not have any users, it belongs in the Staging area
  //&& !Tasks.isTaskAssigned({id: task._id});
  $scope.stagingFilter = function(task) {
    return !task.isCompleted && task.users.length === 0;
  };

  // if a task is not completed but has been assigned to a user, it belongs in the Assigned area
  $scope.assignedFilter = function(task) {
    return !task.isCompleted && task.users.length > 0;
  };

  // if a task has been completed, it belongs in the Completed area
  $scope.completedFilter = function(task) {
    return task.isCompleted ? true : false;
  };

  // function for the go to Dashboard button
  $scope.goToDash = function() {
    $location.path('/org');
  };
  // function for the signout button
  $scope.signout = Auth.signout;
});


/*  this solution to pass jsHINT did not work in production
        .then(checkChangedUser(resp)
          )
          .catch(
            catchError(err)
          );*/



//    found = true;

//    break;
// }
// these next two functions are called by the promise inside the loop below. They are named and written outside the loop to please jshint
// but...did not work under actual use
// var checkChangedUser = function(resp){
//   if (changedUser) {
//     $scope.getTasks();
//   }
// };
// var catchError = function(err){ console.log(err);};


// for (var i = 0; i < $scope.data.tasks.length; i++) {
//   var currentTask = $scope.data.tasks[i];
//   if ( task._id && task._id === currentTask._id ) {
//     Tasks.updateTask(task)
//     .then(function(resp) {
//       if (changedUser) {
//         $scope.getTasks();
//       }
//     })
//     .catch(function(err) {
//       console.log(err);
//     });

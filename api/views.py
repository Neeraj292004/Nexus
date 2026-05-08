# pyrefly: ignore [missing-import]
from rest_framework import viewsets, generics, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView  
# pyrefly: ignore [missing-import]
from django.utils import timezone
from django.db.models import Count, Q
from .models import User, Project, Task
from .serializers import UserSerializer, ProjectSerializer, TaskSerializer
from .permissions import IsAdminOrReadOnly

class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]
        return super().get_permissions()

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now().date()
        
        if request.user.role == 'Admin':
            tasks = Task.objects.all()
        else:
            tasks = Task.objects.filter(assigned_to=request.user)
            
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='Completed').count()
        pending_tasks = tasks.filter(status='Pending').count()
        in_progress_tasks = tasks.filter(status='In Progress').count()
        overdue_tasks = tasks.filter(due_date__lt=now).exclude(status='Completed').count()

        return Response({
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'in_progress_tasks': in_progress_tasks,
            'overdue_tasks': overdue_tasks,
        })

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

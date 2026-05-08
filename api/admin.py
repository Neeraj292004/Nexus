from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Project, Task

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Info', {'fields': ('role',)}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Project)
admin.site.register(Task)

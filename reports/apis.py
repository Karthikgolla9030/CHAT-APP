from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Report, BlockedWord
from .serializers import ReportSerializer, BlockedWordSerializer


class ReportListAPI(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Report.objects.all().order_by('-created_at')


class ReportRetrieveUpdateAPI(generics.RetrieveUpdateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Report.objects.all()


class BlockedWordListCreateAPI(generics.ListCreateAPIView):
    serializer_class = BlockedWordSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = BlockedWord.objects.all()


class BlockedWordDeleteAPI(generics.DestroyAPIView):
    serializer_class = BlockedWordSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = BlockedWord.objects.all()

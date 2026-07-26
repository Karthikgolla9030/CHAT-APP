from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import Interest, Profile
from .serializers import (
    UserSerializer, ProfileSerializer, RegisterSerializer,
    GuestLoginSerializer, InterestSerializer
)
from .services import get_tokens_for_user, create_guest_user, update_user_interests

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if not user and username:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if user:
            tokens = get_tokens_for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            })
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class GuestLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from common.captcha import verify_and_consume_proof_token
        serializer = GuestLoginSerializer(data=request.data)
        if serializer.is_valid():
            proof_token = serializer.validated_data['captcha_proof_token']
            is_valid_token, err_msg = verify_and_consume_proof_token(proof_token)
            if not is_valid_token:
                return Response({'detail': err_msg}, status=status.HTTP_400_BAD_REQUEST)

            nickname = serializer.validated_data.get('nickname', '')
            user = create_guest_user(nickname=nickname)
            tokens = get_tokens_for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile = request.user.profile
        profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
            
            interests = request.data.get('interests')
            if isinstance(interests, list):
                update_user_interests(request.user, interests)

            return Response(UserSerializer(request.user).data)
        return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InterestListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Interest.objects.all()
    serializer_class = InterestSerializer


class CaptchaGenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from common.captcha import generate_captcha_challenge
        challenge = generate_captcha_challenge()
        return Response(challenge)


class CaptchaVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from common.captcha import verify_captcha_challenge, verify_external_captcha_token
        
        external_token = request.data.get('captcha_token') or request.data.get('h_captcha_response') or request.data.get('g_recaptcha_response')
        if external_token:
            valid, proof_token = verify_external_captcha_token(external_token)
            if valid:
                return Response({
                    'status': 'verified',
                    'detail': 'CAPTCHA verification successful',
                    'captcha_proof_token': proof_token
                })
            return Response({'detail': 'External CAPTCHA verification failed. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        answer = request.data.get('answer')
        timestamp = request.data.get('timestamp')
        token = request.data.get('token')

        if answer is None or not timestamp or not token:
            return Response({'detail': 'answer, timestamp, and token are required'}, status=status.HTTP_400_BAD_REQUEST)

        valid, proof_token = verify_captcha_challenge(answer, timestamp, token)
        if valid:
            return Response({
                'status': 'verified',
                'detail': 'CAPTCHA challenge passed',
                'captcha_proof_token': proof_token
            })
        return Response({'detail': 'Incorrect answer. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)


class ClaimAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .services import claim_guest_account
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response({'detail': 'username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = claim_guest_account(request.user, username, email, password)
            tokens = get_tokens_for_user(user)
            return Response({
                'detail': 'Account successfully claimed!',
                'user': UserSerializer(user).data,
                'tokens': tokens
            })
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

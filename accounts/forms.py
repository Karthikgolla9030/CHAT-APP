from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm, SetPasswordForm
from .models import User, Profile
from core.validators import UsernameValidator, AgeValidator, BadWordValidator


class RegisterForm(UserCreationForm):
    username = forms.CharField(max_length=30, validators=[UsernameValidator()])
    email = forms.EmailField(required=True)
    display_name = forms.CharField(max_length=100, required=False)
    age = forms.IntegerField(required=False, validators=[AgeValidator()])
    gender = forms.ChoiceField(choices=Profile.GENDER_CHOICES, required=False)
    looking_for = forms.ChoiceField(choices=Profile.LOOKING_FOR_CHOICES, required=False)
    country = forms.CharField(max_length=100, required=False)
    languages = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False, help_text='Comma separated')
    interests = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False, help_text='Comma separated')
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False, max_length=500)
    accept_terms = forms.BooleanField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'display_name', 'age', 'gender', 'looking_for', 'country', 'languages', 'interests', 'bio', 'accept_terms']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exclude(username=self.cleaned_data.get('username')).exists():
            raise forms.ValidationError('Email already exists.')
        return email

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('Username already taken.')
        return username

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
            Profile.objects.create(
                user=user,
                username=self.cleaned_data['username'],
                display_name=self.cleaned_data.get('display_name', ''),
                age=self.cleaned_data.get('age'),
                gender=self.cleaned_data.get('gender', 'prefer_not_to_say'),
                looking_for=self.cleaned_data.get('looking_for', 'anything'),
                country=self.cleaned_data.get('country', ''),
                languages=[x.strip() for x in self.cleaned_data.get('languages', '').split(',') if x.strip()],
                interests=[x.strip() for x in self.cleaned_data.get('interests', '').split(',') if x.strip()],
                bio=self.cleaned_data.get('bio', ''),
            )
        return user


class GuestLoginForm(forms.Form):
    nickname = forms.CharField(max_length=30, required=False, help_text='Optional display name')


class LoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'}))


class ProfileForm(forms.ModelForm):
    languages = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)
    interests = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)
    favorite_topics = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)
    skill_tags = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)
    hobbies = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)

    class Meta:
        model = Profile
        fields = ['username', 'display_name', 'age', 'gender', 'looking_for', 'country', 'state', 'languages', 'interests', 'bio', 'profile_picture', 'favorite_topics', 'skill_tags', 'hobbies']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3, 'maxlength': 500}),
        }

    def clean_languages(self):
        val = self.cleaned_data.get('languages', '')
        return [x.strip() for x in val.split(',') if x.strip()]

    def clean_interests(self):
        val = self.cleaned_data.get('interests', '')
        return [x.strip() for x in val.split(',') if x.strip()]

    def clean_favorite_topics(self):
        val = self.cleaned_data.get('favorite_topics', '')
        return [x.strip() for x in val.split(',') if x.strip()]

    def clean_skill_tags(self):
        val = self.cleaned_data.get('skill_tags', '')
        return [x.strip() for x in val.split(',') if x.strip()]

    def clean_hobbies(self):
        val = self.cleaned_data.get('hobbies', '')
        return [x.strip() for x in val.split(',') if x.strip()]

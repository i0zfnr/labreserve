<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class LecturerController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->is_active && $request->user()->role === 'admin', 403);
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);
        return User::where('role', 'lecturer')->orderBy('name')->paginate(50);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'department' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', Password::min(12)],
        ]);
        $user = User::create($data + ['role' => 'lecturer', 'is_active' => true]);
        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);
        abort_unless($user->role === 'lecturer', 404);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);
        $user->update($data);
        return ['data' => $user];
    }
}

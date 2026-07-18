class UserMapper {
  toResponse(user) {
    if (!user) return null;

    return {
      id: user._id.toString(),
      code: user.code,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      provider: user.provider,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toAuthResponse(user, accessToken) {
    return {
      accessToken,

      user: this.toResponse(user),
    };
  }
}

export default new UserMapper();
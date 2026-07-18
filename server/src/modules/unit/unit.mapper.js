class UnitMapper {
  toResponse(unit) {
    if (!unit) {
      return null;
    }

    return {
      id: unit._id.toString(),

      code: unit.code,

      name: unit.name,

      symbol: unit.symbol,

      description: unit.description,

      status: unit.status,

      createdAt: unit.createdAt,

      updatedAt: unit.updatedAt,
    };
  }

  toList(units) {
    return units.map((unit) => this.toResponse(unit));
  }
}

export default new UnitMapper();

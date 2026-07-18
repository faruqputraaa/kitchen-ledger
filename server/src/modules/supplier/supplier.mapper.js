class SupplierMapper {
  toResponse(supplier) {
    if (!supplier) {
      return null;
    }

    return {
      id: supplier._id.toString(),

      code: supplier.code,

      name: supplier.name,

      contactPerson: supplier.contactPerson,

      phone: supplier.phone,

      email: supplier.email,

      address: supplier.address,

      notes: supplier.notes,

      status: supplier.status,

      createdAt: supplier.createdAt,

      updatedAt: supplier.updatedAt,
    };
  }

  toList(suppliers) {
    return suppliers.map((supplier) => this.toResponse(supplier));
  }
}

export default new SupplierMapper();

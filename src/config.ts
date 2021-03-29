const fieldsFragment = `fragment fields on file {
  id
  fileType
  name
  mimeType
  contentLength
  created_at
  updated_at
  domain
  groupId
  postId
  userId
}`;

export default {
  hasuraUrl: 'https://api.thelitas.co/v1/graphql',
  getOperation: 'file_by_pk',
  getQuery: `query fileById($id: uuid!) {
    file_by_pk(id: $id) {
      ...fields
    }
  }
  ${fieldsFragment}`,
  insertOperation: 'insert_file_one',
  insertMutation: `mutation insertFile($file:file_insert_input!) {
    insert_file_one(object:$file) {
      ...fields
    }
  }
  ${fieldsFragment}`,
  updateOperation: 'update_file_by_pk',
  updateMutation: `mutation updateFile($id: uuid!, $file: file_set_input!) {
    update_file_by_pk(_set: $file, pk_columns: {id: $id}) {
      ...fields
    }
  }
  ${fieldsFragment}`,
  deleteOperation: 'delete_file_by_pk',
  deleteMutation: `mutation deleteFile($id: uuid!) {
    delete_file_by_pk(id: $id) {
      ...fields
    }
  }
  ${fieldsFragment}`,
};

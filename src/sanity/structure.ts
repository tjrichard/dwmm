import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Works')
        .child(
          S.list()
            .title('Works')
            .items([
              S.listItem()
                .title('All Works')
                .schemaType('work')
                .child(
                  S.documentList()
                    .title('All Works')
                    .filter('_type == "work"')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('Blog')
                .schemaType('work')
                .child(
                  S.documentList()
                    .title('Blog')
                    .filter('_type == "work" && contentKind == "blog"')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('Portfolio')
                .schemaType('work')
                .child(
                  S.documentList()
                    .title('Portfolio')
                    .filter('_type == "work" && contentKind == "portfolio"')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
                ),
            ])
        ),
      S.divider(),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('tag').title('Tags'),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (li) => !['work', 'category', 'tag'].includes(li.getId() || '')
      ),
    ])

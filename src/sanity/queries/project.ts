export const projectCardProjection = `
  title,
  slug,
  year,
  role,

"categories": coalesce(
  categories[]->{
    _id,
    name,
    slug,
    order,
    atlas{isTerritory, color}
  },
  []
),

  atlas{territory{_ref}},

  cover{
    _type,

    image{
      asset->{
        _id,
        url,
        metadata{
          dimensions{
            width,
            height
          }
        }
      }
    },

    alt
  },

`;

export const projectProjection = `
  _id,
  ${projectCardProjection}
  description,
  context,

  status,
  organization,

  "technologies": coalesce(technologies, []),

  "team": coalesce(
  team[]{
    name,
    role
  },
  []
),

  "media": coalesce(
  media[]{
    _type,

    _type == "projectImage" => {
      image{
        asset->{
          _id,
          url,
          metadata{
            dimensions{
              width,
              height
            }
          }
        }
      },

      alt
    },

    _type == "projectVideo" => {
      video{
        asset->{
          _id,
          url,
          "thumbnail": videoThumbnail->{_id, url}
        }
      }
    }
  },
  []
),

  github,
  liveSite,

 playable{
  type,
  source,
  width,
  height
},

  featured,
  order,

  seo{
    title,
    description
  }
`;
